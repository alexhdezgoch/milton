import Stripe from 'npm:stripe@14.21.0'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
console.log('Stripe key present:', !!stripeSecretKey, 'starts with:', stripeSecretKey?.substring(0, 10))

const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Request received, method:', req.method)
    const contentType = req.headers.get('content-type') || ''

    // Handle webhook from Stripe
    if (contentType.includes('application/json') && req.headers.get('stripe-signature')) {
      return handleWebhook(req)
    }

    // Handle API calls from frontend
    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'health':
        return new Response(JSON.stringify({ status: 'ok', stripeKeyPresent: !!stripeSecretKey }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      case 'create-checkout-session':
        return createCheckoutSession(body)
      case 'create-portal-session':
        return createPortalSession(body)
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function createCheckoutSession(body: { userId: string; returnUrl: string }) {
  const { userId, returnUrl } = body
  console.log('[checkout] Starting checkout session creation for user:', userId)

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  console.log('[checkout] Supabase client created')

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, stripe_customer_id')
    .eq('id', userId)
    .single()

  console.log('[checkout] Profile lookup result:', { profile, profileError })

  if (profileError) {
    throw new Error(`Profile lookup failed: ${profileError.message}`)
  }

  let customerId = profile?.stripe_customer_id

  // Create Stripe customer if needed (don't save to DB yet - webhook will save on checkout completion)
  if (!customerId) {
    console.log('[checkout] Creating new Stripe customer with email:', profile?.email)
    const customer = await stripe.customers.create({
      email: profile?.email,
      metadata: { supabase_user_id: userId }
    })
    customerId = customer.id
    console.log('[checkout] Created Stripe customer:', customerId)
  }

  // Get price ID from environment
  const priceId = Deno.env.get('STRIPE_PRICE_ID')
  console.log('[checkout] Price ID:', priceId)
  if (!priceId) {
    throw new Error('STRIPE_PRICE_ID not configured')
  }

  console.log('[checkout] Creating checkout session...')
  // Create checkout session with 7-day trial (embedded mode)
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
    },
    payment_method_collection: 'always',
    ui_mode: 'embedded',
    return_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    metadata: { supabase_user_id: userId }
  })
  console.log('[checkout] Checkout session created:', session.id)

  return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function createPortalSession(body: { customerId: string; returnUrl: string }) {
  const { customerId, returnUrl } = body

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  })

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handleWebhook(req: Request) {
  console.log('🔔 [WEBHOOK] Received webhook request')

  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  const body = await req.text()

  // Debug: Log environment variable presence (not values)
  console.log('🔍 [WEBHOOK] Environment check:', {
    hasStripeSignature: !!signature,
    hasWebhookSecret: !!webhookSecret,
    webhookSecretLength: webhookSecret?.length || 0,
    bodyLength: body.length
  })

  if (!signature) {
    console.error('❌ [WEBHOOK] Missing stripe-signature header')
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  if (!webhookSecret) {
    console.error('❌ [WEBHOOK] Missing STRIPE_WEBHOOK_SECRET env var')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  let event: Stripe.Event

  try {
    console.log('🔐 [WEBHOOK] Attempting signature verification...')
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
    console.log('✅ [WEBHOOK] Signature verified successfully')
  } catch (err) {
    console.error('❌ [WEBHOOK] Signature verification failed:', err.message)
    return new Response(`Webhook signature verification failed: ${err.message}`, {
      status: 400
    })
  }

  console.log('📦 [WEBHOOK] Event type:', event.type)

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      const subscriptionId = session.subscription as string

      console.log('🛒 [WEBHOOK] checkout.session.completed:', {
        userId,
        subscriptionId,
        customerId: session.customer
      })

      if (userId && subscriptionId) {
        // Get subscription to check if it's trialing
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const status = subscription.status === 'trialing' ? 'trialing' : 'active'
        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null

        console.log('📊 [WEBHOOK] Subscription status:', { status, trialEnd })

        const { data, error } = await supabase
          .from('profiles')
          .update({
            subscription_status: status,
            stripe_customer_id: session.customer as string,
            trial_ends_at: trialEnd
          })
          .eq('id', userId)
          .select()

        if (error) {
          console.error('❌ [WEBHOOK] Database update failed:', error)
        } else {
          console.log('✅ [WEBHOOK] Database updated successfully:', data)
        }
      } else {
        console.warn('⚠️ [WEBHOOK] Missing userId or subscriptionId, skipping update')
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      console.log('🔄 [WEBHOOK] customer.subscription.updated:', {
        customerId,
        subscriptionStatus: subscription.status
      })

      let status: string
      if (subscription.status === 'trialing') {
        status = 'trialing'
      } else if (subscription.status === 'active') {
        status = 'active'
      } else if (subscription.status === 'past_due') {
        status = 'past_due'
      } else {
        status = 'canceled'
      }

      const trialEnd = subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null

      const { data, error } = await supabase
        .from('profiles')
        .update({
          subscription_status: status,
          trial_ends_at: trialEnd
        })
        .eq('stripe_customer_id', customerId)
        .select()

      if (error) {
        console.error('❌ [WEBHOOK] Database update failed:', error)
      } else {
        console.log('✅ [WEBHOOK] Database updated successfully:', data)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      console.log('🗑️ [WEBHOOK] customer.subscription.deleted:', { customerId })

      const { data, error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'canceled' })
        .eq('stripe_customer_id', customerId)
        .select()

      if (error) {
        console.error('❌ [WEBHOOK] Database update failed:', error)
      } else {
        console.log('✅ [WEBHOOK] Database updated successfully:', data)
      }
      break
    }

    default:
      console.log('ℹ️ [WEBHOOK] Unhandled event type:', event.type)
  }

  console.log('✅ [WEBHOOK] Webhook processing complete')
  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
