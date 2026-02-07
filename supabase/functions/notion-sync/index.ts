import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface Snip {
  id: string
  title: string
  timestamp_seconds: number
  timestamp_formatted: string
  bullets: string[] | null
  quote: string | null
  created_at: string
}

interface Video {
  id: string
  youtube_id: string
  youtube_url: string
  title: string
  author: string
  thumbnail_url: string
  notion_page_id: string | null
  snips: Snip[]
  summary: { main_point: string; key_takeaways: string[] } | null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from auth header or from request body (for batch calls)
    let userId: string | null = null

    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id ?? null
    }

    // Allow batch calls to specify user_id directly (with service key)
    if (!userId) {
      try {
        const body = await req.json()
        userId = body.user_id
      } catch {
        // No body
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get user's Notion credentials
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('notion_access_token, notion_database_id, notion_sync_enabled')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!profile.notion_sync_enabled || !profile.notion_access_token || !profile.notion_database_id) {
      return new Response(JSON.stringify({ error: 'Notion not connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get videos with unsynced snips
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select(`
        id,
        youtube_id,
        youtube_url,
        title,
        author,
        thumbnail_url,
        notion_page_id,
        snips!inner(id, title, timestamp_seconds, timestamp_formatted, bullets, quote, created_at, notion_synced_at),
        summaries(main_point, key_takeaways)
      `)
      .eq('user_id', userId)
      .is('snips.notion_synced_at', null)

    if (videosError) {
      console.error('Failed to fetch videos:', videosError)
      return new Response(JSON.stringify({ error: 'Failed to fetch videos' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const results = {
      pagesCreated: 0,
      pagesUpdated: 0,
      snipsSynced: 0,
      errors: [] as string[]
    }

    for (const rawVideo of videos || []) {
      // Normalize summaries array to single object
      const video: Video = {
        ...rawVideo,
        snips: rawVideo.snips || [],
        summary: rawVideo.summaries?.[0] || null
      }

      try {
        if (video.notion_page_id) {
          // Append new snips to existing page
          await appendSnipsToPage(
            profile.notion_access_token,
            video.notion_page_id,
            video.snips,
            video.youtube_id
          )
          results.pagesUpdated++
        } else {
          // Create new page with video info + snips
          const pageId = await createVideoPage(
            profile.notion_access_token,
            profile.notion_database_id,
            video
          )

          if (pageId) {
            // Store the page ID on the video
            await supabase
              .from('videos')
              .update({ notion_page_id: pageId })
              .eq('id', video.id)
            results.pagesCreated++
          }
        }

        // Mark snips as synced
        const snipIds = video.snips.map(s => s.id)
        if (snipIds.length > 0) {
          await supabase
            .from('snips')
            .update({ notion_synced_at: new Date().toISOString() })
            .in('id', snipIds)
          results.snipsSynced += snipIds.length
        }

      } catch (err) {
        console.error(`Failed to sync video ${video.id}:`, err)
        results.errors.push(`Video ${video.title}: ${err.message}`)
      }
    }

    // Update last synced timestamp
    await supabase
      .from('profiles')
      .update({ notion_last_synced_at: new Date().toISOString() })
      .eq('id', userId)

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('notion-sync error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function createVideoPage(
  accessToken: string,
  databaseId: string,
  video: Video
): Promise<string | null> {
  const appUrl = Deno.env.get('APP_URL') || 'https://app.milton.com'

  // Build page content blocks
  const children: any[] = []

  // AI Summary section (collapsed toggle)
  if (video.summary?.main_point) {
    children.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: 'AI Summary' } }]
      }
    })

    children.push({
      object: 'block',
      type: 'toggle',
      toggle: {
        rich_text: [{ type: 'text', text: { content: video.summary.main_point } }],
        children: (video.summary.key_takeaways || []).map(takeaway => ({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: takeaway } }]
          }
        }))
      }
    })

    children.push({ object: 'block', type: 'divider', divider: {} })
  }

  // Snips section
  children.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: 'Snips' } }]
    }
  })

  // Add each snip
  for (const snip of video.snips) {
    children.push(...formatSnipBlocks(snip, video.youtube_id))
  }

  // Create the page
  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      cover: video.thumbnail_url ? {
        type: 'external',
        external: { url: video.thumbnail_url }
      } : undefined,
      properties: {
        'Title': {
          title: [{ type: 'text', text: { content: video.title || 'Untitled Video' } }]
        },
        'YouTube URL': { url: video.youtube_url },
        'Channel': {
          rich_text: [{ type: 'text', text: { content: video.author || '' } }]
        },
        'Snips Count': { number: video.snips.length },
        'Milton Link': { url: `${appUrl}/video/${video.id}` },
        'Last Synced': { date: { start: new Date().toISOString() } }
      },
      children
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Failed to create Notion page:', errorText)
    throw new Error(`Notion API error: ${response.status}`)
  }

  const data = await response.json()
  return data.id
}

async function appendSnipsToPage(
  accessToken: string,
  pageId: string,
  snips: Snip[],
  youtubeId: string
): Promise<void> {
  // Build blocks for new snips
  const children: any[] = []
  for (const snip of snips) {
    children.push(...formatSnipBlocks(snip, youtubeId))
  }

  // Append to page
  const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ children })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Failed to append to Notion page:', errorText)
    throw new Error(`Notion API error: ${response.status}`)
  }

  // Also update the snips count and last synced date
  // First get current count
  const pageResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Notion-Version': '2022-06-28'
    }
  })

  if (pageResponse.ok) {
    const pageData = await pageResponse.json()
    const currentCount = pageData.properties?.['Snips Count']?.number || 0

    await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          'Snips Count': { number: currentCount + snips.length },
          'Last Synced': { date: { start: new Date().toISOString() } }
        }
      })
    })
  }
}

function formatSnipBlocks(snip: Snip, youtubeId: string): any[] {
  const blocks: any[] = []
  const youtubeUrl = `https://youtube.com/watch?v=${youtubeId}&t=${snip.timestamp_seconds}`

  // Snip title with timestamp link
  blocks.push({
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: `${snip.timestamp_formatted} - ${snip.title}`,
            link: { url: youtubeUrl }
          },
          annotations: { bold: true }
        }
      ],
      children: [
        // Quote if present
        ...(snip.quote ? [{
          object: 'block',
          type: 'quote',
          quote: {
            rich_text: [{ type: 'text', text: { content: snip.quote } }]
          }
        }] : []),
        // Bullet points
        ...(snip.bullets || []).map(bullet => ({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: bullet } }]
          }
        }))
      ]
    }
  })

  return blocks
}
