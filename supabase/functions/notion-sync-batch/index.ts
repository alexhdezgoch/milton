import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // This endpoint should only be called by pg_cron or with service role key
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.includes(supabaseServiceKey)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get users due for sync:
    // - notion_sync_enabled = true
    // - active subscription (active or trialing with valid trial)
    // - last sync >24h ago (or never synced)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, notion_last_synced_at')
      .eq('notion_sync_enabled', true)
      .in('subscription_status', ['active', 'trialing'])
      .not('notion_access_token', 'is', null)
      .or(`notion_last_synced_at.is.null,notion_last_synced_at.lt.${oneDayAgo}`)

    if (usersError) {
      console.error('Failed to fetch users:', usersError)
      return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const results: { userId: string; status: string; error?: string }[] = []

    for (const user of users || []) {
      try {
        // Check if trialing user still has valid trial
        if (user.subscription_status === 'trialing') {
          const { data: profile } = await supabase
            .from('profiles')
            .select('trial_ends_at')
            .eq('id', user.id)
            .single()

          if (!profile?.trial_ends_at || new Date(profile.trial_ends_at) < new Date()) {
            results.push({ userId: user.id, status: 'skipped', error: 'Trial expired' })
            continue
          }
        }

        // Call notion-sync for this user
        const syncResponse = await fetch(`${supabaseUrl}/functions/v1/notion-sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user_id: user.id })
        })

        if (syncResponse.ok) {
          const syncResult = await syncResponse.json()
          results.push({
            userId: user.id,
            status: 'synced',
            ...syncResult
          })
        } else {
          const errorText = await syncResponse.text()
          results.push({ userId: user.id, status: 'error', error: errorText })
        }

      } catch (err) {
        results.push({ userId: user.id, status: 'error', error: err.message })
      }
    }

    return new Response(JSON.stringify({
      processed: results.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('notion-sync-batch error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
