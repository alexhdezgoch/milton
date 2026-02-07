import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const notionClientId = Deno.env.get('NOTION_CLIENT_ID')!
const notionClientSecret = Deno.env.get('NOTION_CLIENT_SECRET')!
const notionRedirectUri = Deno.env.get('NOTION_REDIRECT_URI')!

serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Helper to redirect with error
  const redirectWithError = (returnUrl: string, message: string) => {
    const redirectUrl = new URL(returnUrl)
    redirectUrl.searchParams.set('notion_error', message)
    return Response.redirect(redirectUrl.toString(), 302)
  }

  try {
    // Handle Notion OAuth errors
    if (error) {
      console.error('Notion OAuth error:', error)
      // Try to get return URL from state if available
      let returnUrl = 'https://app.milton.com'
      if (state) {
        const { data: stateData } = await supabase
          .from('oauth_states')
          .select('return_url')
          .eq('state', state)
          .single()
        if (stateData?.return_url) {
          returnUrl = stateData.return_url
        }
        // Clean up state
        await supabase.from('oauth_states').delete().eq('state', state)
      }
      return redirectWithError(returnUrl, 'Authorization was denied')
    }

    if (!code || !state) {
      return new Response('Missing code or state parameter', { status: 400 })
    }

    // Validate state and get user
    const { data: stateData, error: stateError } = await supabase
      .from('oauth_states')
      .select('user_id, return_url, expires_at')
      .eq('state', state)
      .single()

    if (stateError || !stateData) {
      return new Response('Invalid or expired state', { status: 400 })
    }

    // Check expiration
    if (new Date(stateData.expires_at) < new Date()) {
      await supabase.from('oauth_states').delete().eq('state', state)
      return redirectWithError(stateData.return_url, 'OAuth session expired')
    }

    // Delete state immediately to prevent replay
    await supabase.from('oauth_states').delete().eq('state', state)

    // Exchange code for token
    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${notionClientId}:${notionClientSecret}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: notionRedirectUri
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return redirectWithError(stateData.return_url, 'Failed to connect to Notion')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    const workspaceId = tokenData.workspace_id
    const workspaceName = tokenData.workspace_name

    // Create "Milton Snips" database in user's Notion workspace
    const databaseId = await createMiltonDatabase(accessToken)

    if (!databaseId) {
      return redirectWithError(stateData.return_url, 'Failed to create Milton database in Notion')
    }

    // Update user profile with Notion credentials
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        notion_access_token: accessToken,
        notion_workspace_id: workspaceId,
        notion_workspace_name: workspaceName,
        notion_database_id: databaseId,
        notion_sync_enabled: true,
        notion_last_synced_at: null
      })
      .eq('id', stateData.user_id)

    if (updateError) {
      console.error('Failed to update profile:', updateError)
      return redirectWithError(stateData.return_url, 'Failed to save Notion connection')
    }

    // Redirect back to app with success
    const redirectUrl = new URL(stateData.return_url)
    redirectUrl.searchParams.set('notion_connected', 'true')
    return Response.redirect(redirectUrl.toString(), 302)

  } catch (err) {
    console.error('notion-callback error:', err)
    return new Response(`Internal error: ${err.message}`, { status: 500 })
  }
})

async function createMiltonDatabase(accessToken: string): Promise<string | null> {
  try {
    // First, search for a page to use as parent (user must have shared at least one page)
    const searchResponse = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: { property: 'object', value: 'page' },
        page_size: 1
      })
    })

    if (!searchResponse.ok) {
      console.error('Notion search failed:', await searchResponse.text())
      return null
    }

    const searchData = await searchResponse.json()

    // If no pages found, we can't create a database
    if (!searchData.results || searchData.results.length === 0) {
      console.error('No pages found in Notion workspace - user needs to share a page')
      return null
    }

    const parentPageId = searchData.results[0].id

    // Create the Milton Snips database
    const createResponse = await fetch('https://api.notion.com/v1/databases', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { type: 'page_id', page_id: parentPageId },
        icon: { type: 'emoji', emoji: '✂️' },
        title: [{ type: 'text', text: { content: 'Milton Snips' } }],
        properties: {
          'Title': { title: {} },
          'YouTube URL': { url: {} },
          'Channel': { rich_text: {} },
          'Snips Count': { number: {} },
          'Milton Link': { url: {} },
          'Last Synced': { date: {} }
        }
      })
    })

    if (!createResponse.ok) {
      console.error('Failed to create database:', await createResponse.text())
      return null
    }

    const dbData = await createResponse.json()
    return dbData.id

  } catch (err) {
    console.error('createMiltonDatabase error:', err)
    return null
  }
}
