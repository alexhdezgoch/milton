import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!
const appUrl = Deno.env.get('APP_URL') || 'https://app.yourdomain.com'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate the date range for trials ending in ~2 days
    // We look for trials ending between 1.5 and 2.5 days from now to handle daily cron timing
    const now = new Date()
    const minDate = new Date(now.getTime() + (1.5 * 24 * 60 * 60 * 1000))
    const maxDate = new Date(now.getTime() + (2.5 * 24 * 60 * 60 * 1000))

    // Get trialing users whose trial ends in ~2 days and haven't been reminded yet
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, display_name, trial_ends_at')
      .eq('subscription_status', 'trialing')
      .gte('trial_ends_at', minDate.toISOString())
      .lte('trial_ends_at', maxDate.toISOString())
      .is('trial_reminder_sent_at', null)

    if (usersError) throw usersError

    const results = []

    for (const user of users || []) {
      try {
        await sendTrialReminderEmail(user)

        // Mark that we've sent the reminder
        await supabase
          .from('profiles')
          .update({ trial_reminder_sent_at: new Date().toISOString() })
          .eq('id', user.id)

        results.push({ userId: user.id, email: user.email, status: 'sent' })
      } catch (err) {
        results.push({ userId: user.id, email: user.email, status: 'error', error: err.message })
      }
    }

    return new Response(JSON.stringify({
      processed: results.length,
      results,
      dateRange: { min: minDate.toISOString(), max: maxDate.toISOString() }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function sendTrialReminderEmail(user: {
  id: string
  email: string
  display_name: string
  trial_ends_at: string
}) {
  const trialEndDate = new Date(user.trial_ends_at)
  const formattedDate = trialEndDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  const manageUrl = `${appUrl}?manage=subscription`
  const unsubscribeUrl = `${supabaseUrl}/functions/v1/unsubscribe?user_id=${user.id}`

  const html = `
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
          <span style="color: white; font-size: 20px;">&#9986;</span>
        </div>
        <span style="font-family: Georgia, serif; font-size: 24px; font-weight: 600; color: #111827;">Milton</span>
      </div>
    </div>

    <!-- Main Card -->
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="background: #FEF3C7; border-radius: 8px; padding: 16px; margin-bottom: 24px; display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 20px;">&#9888;</span>
        <div>
          <p style="margin: 0; font-weight: 600; color: #92400E;">Your trial ends ${formattedDate}</p>
          <p style="margin: 4px 0 0; font-size: 14px; color: #B45309;">That's in about 2 days</p>
        </div>
      </div>

      <h1 style="margin: 0 0 16px; font-size: 24px; color: #111827;">Hi ${user.display_name || 'there'},</h1>

      <p style="margin: 0 0 24px; color: #4B5563; line-height: 1.6;">
        We wanted to give you a heads up that your Milton free trial is ending soon.
        After ${formattedDate}, you'll lose access to:
      </p>

      <ul style="margin: 0 0 24px; padding-left: 24px; color: #4B5563; line-height: 1.8;">
        <li>Your saved videos and transcripts</li>
        <li>AI-powered snips and summaries</li>
        <li>Chat with your video library</li>
        <li>Weekly digest emails</li>
      </ul>

      <p style="margin: 0 0 24px; color: #4B5563; line-height: 1.6;">
        If you're enjoying Milton, you don't need to do anything &mdash; your subscription
        will start automatically at <strong>$10/month</strong>.
      </p>

      <p style="margin: 0 0 32px; color: #4B5563; line-height: 1.6;">
        <strong>Want to cancel?</strong> No problem at all. You can cancel anytime before
        your trial ends and you won't be charged.
      </p>

      <a href="${manageUrl}" style="display: block; text-align: center; background: #059669; color: white; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 12px;">
        Manage Your Subscription
      </a>

      <p style="text-align: center; margin: 0; font-size: 14px; color: #6B7280;">
        View billing, update payment method, or cancel
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; color: #9CA3AF; font-size: 14px;">
      <p style="margin: 0 0 8px;">Questions? Just reply to this email.</p>
      <a href="${unsubscribeUrl}" style="color: #6B7280;">Unsubscribe from emails</a>
    </div>
  </div>
</body>
</html>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Milton <hello@yourdomain.com>',
      to: user.email,
      subject: `Your Milton trial ends ${formattedDate}`,
      html
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send email: ${error}`)
  }
}
