import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get users with weekly digest enabled and active subscription
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .eq('weekly_digest_enabled', true)
      .in('subscription_status', ['active', 'trialing'])

    if (usersError) throw usersError

    const results = []

    for (const user of users || []) {
      try {
        const digest = await generateDigestForUser(supabase, user)
        if (digest.hasContent) {
          await sendDigestEmail(user, digest)
          results.push({ userId: user.id, status: 'sent' })
        } else {
          results.push({ userId: user.id, status: 'skipped', reason: 'no content' })
        }
      } catch (err) {
        results.push({ userId: user.id, status: 'error', error: err.message })
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function generateDigestForUser(supabase: any, user: { id: string }) {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  // Get videos added in last 7 days
  const { data: rawVideos } = await supabase
    .from('videos')
    .select('id, title, thumbnail_url, author, status, summary:summaries(main_point, key_takeaways, status)')
    .eq('user_id', user.id)
    .gte('created_at', oneWeekAgo.toISOString())
    .order('created_at', { ascending: false })

  // Normalize summary from array to object (Supabase returns joined relations as arrays)
  const newVideos = (rawVideos || []).map((v: any) => ({
    ...v,
    summary: v.summary?.[0] || null
  }))

  // Get 3 recent snips from new videos
  const recentVideoIds = (newVideos || []).map((v: any) => v.id)
  let recentSnips: any[] = []

  if (recentVideoIds.length > 0) {
    const { data: snips } = await supabase
      .from('snips')
      .select('id, title, timestamp_formatted, bullets, video_id')
      .in('video_id', recentVideoIds)
      .order('created_at', { ascending: false })
      .limit(3)
    recentSnips = snips || []
  }

  // Get 1 random snip from older archives
  const { data: archiveSnips } = await supabase
    .from('snips')
    .select('id, title, timestamp_formatted, bullets, video:videos(title)')
    .eq('user_id', user.id)
    .lt('created_at', oneWeekAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(20)

  let archiveSnip = null
  if (archiveSnips && archiveSnips.length > 0) {
    const randomIndex = Math.floor(Math.random() * archiveSnips.length)
    archiveSnip = archiveSnips[randomIndex]
  }

  return {
    hasContent: (newVideos?.length > 0) || archiveSnip,
    newVideos: newVideos || [],
    recentSnips,
    archiveSnip
  }
}

async function sendDigestEmail(
  user: { id: string; email: string; display_name: string },
  digest: { newVideos: any[]; recentSnips: any[]; archiveSnip: any }
) {
  const html = generateEmailHtml(user, digest)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Milton <digest@yourdomain.com>', // Replace with verified domain
      to: user.email,
      subject: 'Your Week in Milton',
      html
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send email: ${error}`)
  }
}

function generateEmailHtml(
  user: { id: string; display_name: string },
  digest: { newVideos: any[]; recentSnips: any[]; archiveSnip: any }
) {
  const unsubscribeUrl = `${supabaseUrl}/functions/v1/unsubscribe?user_id=${user.id}`
  const videosHtml = digest.newVideos.map(video => {
    const isCompleted = video.summary?.status === 'completed'
    const badgeColor = isCompleted ? '#059669' : '#D97706'
    const badgeBg = isCompleted ? '#ECFDF5' : '#FFFBEB'
    const badgeLabel = isCompleted ? 'Completed' : 'In Progress'

    const summaryHtml = isCompleted ? `
      ${video.summary.main_point ? `<p style="margin: 8px 0 0; font-size: 14px; color: #374151;">${video.summary.main_point}</p>` : ''}
      ${(video.summary.key_takeaways?.length > 0) ? `
        <ul style="margin: 8px 0 0; padding-left: 20px; color: #374151; font-size: 14px;">
          ${video.summary.key_takeaways.map((t: string) => `<li style="margin-bottom: 4px;">${t}</li>`).join('')}
        </ul>
      ` : ''}
    ` : ''

    return `
    <div style="margin-bottom: 16px; display: flex; gap: 12px;">
      <img src="${video.thumbnail_url}" alt="" style="width: 120px; height: 68px; object-fit: cover; border-radius: 8px; flex-shrink: 0;" />
      <div style="min-width: 0;">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <p style="margin: 0; font-weight: 600; color: #111827;">${video.title}</p>
          <span style="display: inline-block; padding: 2px 8px; font-size: 12px; font-weight: 500; color: ${badgeColor}; background: ${badgeBg}; border-radius: 9999px; white-space: nowrap;">${badgeLabel}</span>
        </div>
        <p style="margin: 4px 0 0; font-size: 14px; color: #6B7280;">${video.author}</p>
        ${summaryHtml}
      </div>
    </div>
  `
  }).join('')

  const snipsHtml = digest.recentSnips.map(snip => `
    <div style="margin-bottom: 16px; padding: 12px; background: #F9FAFB; border-radius: 8px;">
      <p style="margin: 0; font-weight: 600; color: #111827;">${snip.title}</p>
      <p style="margin: 4px 0 8px; font-size: 12px; color: #059669;">${snip.timestamp_formatted}</p>
      <ul style="margin: 0; padding-left: 20px; color: #374151;">
        ${(snip.bullets || []).map((b: string) => `<li style="margin-bottom: 4px;">${b}</li>`).join('')}
      </ul>
    </div>
  `).join('')

  const archiveHtml = digest.archiveSnip ? `
    <div style="padding: 16px; background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%); border-radius: 8px; border-left: 4px solid #059669;">
      <p style="margin: 0 0 4px; font-size: 12px; color: #059669; text-transform: uppercase; letter-spacing: 0.05em;">From Your Archives</p>
      <p style="margin: 0 0 4px; font-weight: 600; color: #111827;">${digest.archiveSnip.title}</p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #6B7280;">${digest.archiveSnip.video?.title || ''}</p>
      <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px;">
        ${(digest.archiveSnip.bullets || []).map((b: string) => `<li style="margin-bottom: 4px;">${b}</li>`).join('')}
      </ul>
    </div>
  ` : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F3F4F6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-flex; align-items: center; gap: 8px;">
        <div style="width: 40px; height: 40px; background: #111827; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 20px;">✂</span>
        </div>
        <span style="font-family: Georgia, serif; font-size: 24px; font-weight: 600; color: #111827;">Milton</span>
      </div>
    </div>

    <!-- Main Card -->
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h1 style="margin: 0 0 8px; font-size: 24px; color: #111827;">Your Week in Milton</h1>
      <p style="margin: 0 0 24px; color: #6B7280;">Hi ${user.display_name}, here's what you've been learning.</p>

      ${digest.newVideos.length > 0 ? `
        <div style="margin-bottom: 32px;">
          <h2 style="margin: 0 0 16px; font-size: 16px; color: #111827; text-transform: uppercase; letter-spacing: 0.05em;">This Week's Videos</h2>
          ${videosHtml}
        </div>
      ` : ''}

      ${digest.recentSnips.length > 0 ? `
        <div style="margin-bottom: 32px;">
          <h2 style="margin: 0 0 16px; font-size: 16px; color: #111827; text-transform: uppercase; letter-spacing: 0.05em;">Fresh Snips</h2>
          ${snipsHtml}
        </div>
      ` : ''}

      ${archiveHtml}
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; color: #9CA3AF; font-size: 14px;">
      <p style="margin: 0 0 8px;">You're receiving this because you enabled weekly digests.</p>
      <a href="${unsubscribeUrl}" style="color: #6B7280;">Unsubscribe</a>
    </div>
  </div>
</body>
</html>
  `
}
