import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const notionClientId = Deno.env.get('NOTION_CLIENT_ID')!
const notionRedirectUri = Deno.env.get('NOTION_REDIRECT_URI')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get return URL from request body (optional)
    let returnUrl = `${req.headers.get('origin') || 'https://app.milton.com'}`
    try {
      const body = await req.json()
      if (body.returnUrl) {
        returnUrl = body.returnUrl
      }
    } catch {
      // No body or invalid JSON, use default return URL
    }

    // Generate secure state token
    const state = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store state in database
    const { error: stateError } = await supabase
      .from('oauth_states')
      .insert({
        state,
        user_id: user.id,
        return_url: returnUrl,
        expires_at: expiresAt.toISOString()
      })

    if (stateError) {
      console.error('Failed to store OAuth state:', stateError)
      return new Response(JSON.stringify({ error: 'Failed to initiate OAuth' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Build Notion OAuth URL
    const notionAuthUrl = new URL('https://api.notion.com/v1/oauth/authorize')
    notionAuthUrl.searchParams.set('client_id', notionClientId)
    notionAuthUrl.searchParams.set('redirect_uri', notionRedirectUri)
    notionAuthUrl.searchParams.set('response_type', 'code')
    notionAuthUrl.searchParams.set('owner', 'user')
    notionAuthUrl.searchParams.set('state', state)

    return new Response(JSON.stringify({ url: notionAuthUrl.toString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('notion-auth error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
