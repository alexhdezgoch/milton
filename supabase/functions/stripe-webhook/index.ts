import Stripe from 'https://esm.sh/stripe@14?target=denonext'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
console.log('Stripe key present:', !!stripeSecretKey, 'starts with:', stripeSecretKey?.substring(0, 10))

const cryptoProvider = Stripe.createSubtleCryptoProvider()

const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
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
        return await createCheckoutSession(body)
      case 'create-portal-session':
        return await createPortalSession(body)
      case 'verify-checkout-session':
        return await verifyCheckoutSession(body)
      case 'verify-subscription':
        return await verifySubscription(body)
      case 'create-customer':
        return await createStripeCustomer(body)
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

  // Create Stripe customer if needed — save to DB immediately so profile is consistent
  if (!customerId) {
    console.log('[checkout] Creating new Stripe customer with email:', profile?.email)
    const customer = await stripe.customers.create({
      email: profile?.email,
      metadata: { supabase_user_id: userId }
    })
    customerId = customer.id
    console.log('[checkout] Created Stripe customer:', customerId)
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId)
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

async function createStripeCustomer(body: { userId: string }) {
  const { userId } = body
  console.log('[create-customer] Creating Stripe customer for user:', userId)

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, stripe_customer_id')
    .eq('id', userId)
    .single()

  if (profileError) {
    throw new Error(`Profile lookup failed: ${profileError.message}`)
  }

  // Idempotent: return existing customer if already set
  if (profile?.stripe_customer_id) {
    console.log('[create-customer] Already has customer:', profile.stripe_customer_id)
    return new Response(JSON.stringify({ customerId: profile.stripe_customer_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const customer = await stripe.customers.create({
    email: profile?.email,
    metadata: { supabase_user_id: userId }
  })
  console.log('[create-customer] Created Stripe customer:', customer.id)

  await supabase.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', userId)

  return new Response(JSON.stringify({ customerId: customer.id }), {
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

async function verifyCheckoutSession(body: { sessionId: string; userId: string }) {
  const { sessionId, userId } = body
  console.log('[verify] Verifying checkout session:', sessionId, 'for user:', userId)

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Retrieve the checkout session from Stripe
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  console.log('[verify] Session status:', session.status, 'payment_status:', session.payment_status)

  if (session.status !== 'complete') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Checkout session not complete'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Verify this session belongs to the requesting user
  if (session.metadata?.supabase_user_id !== userId) {
    console.error('[verify] User mismatch:', session.metadata?.supabase_user_id, '!==', userId)
    return new Response(JSON.stringify({
      success: false,
      error: 'Session does not belong to this user'
    }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Get subscription details
  const subscriptionId = session.subscription as string
  if (!subscriptionId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'No subscription found in session'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const status = subscription.status === 'trialing' ? 'trialing' : 'active'
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null

  console.log('[verify] Updating profile with:', {
    status,
    customerId: session.customer,
    trialEnd
  })

  // Update the profile
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
    console.error('[verify] Database update failed:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update profile'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  console.log('[verify] Profile updated successfully:', data)
  return new Response(JSON.stringify({
    success: true,
    profile: data?.[0]
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function verifySubscription(body: { userId: string; stripeCustomerId: string }) {
  const { userId, stripeCustomerId } = body
  console.log('[verify-sub] Verifying subscription for customer:', stripeCustomerId, 'user:', userId)

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get the customer's subscriptions from Stripe
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    limit: 1,
  })

  let status = 'canceled'
  let trialEnd: string | null = null

  if (subscriptions.data.length > 0) {
    const sub = subscriptions.data[0]
    if (sub.status === 'trialing') {
      status = 'trialing'
    } else if (sub.status === 'active') {
      status = 'active'
    } else if (sub.status === 'past_due') {
      status = 'past_due'
    } else {
      status = 'canceled'
    }
    trialEnd = sub.trial_end
      ? new Date(sub.trial_end * 1000).toISOString()
      : null
  }

  console.log('[verify-sub] Stripe says status:', status)

  // Update the profile to match Stripe
  const { data, error } = await supabase
    .from('profiles')
    .update({
      subscription_status: status,
      trial_ends_at: trialEnd
    })
    .eq('id', userId)
    .select()

  if (error) {
    console.error('[verify-sub] Database update failed:', error)
    return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  console.log('[verify-sub] Profile updated:', data)
  return new Response(JSON.stringify({
    status,
    profile: data?.[0]
  }), {
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
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret, undefined, cryptoProvider)
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

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.subscription as string
      const customerId = invoice.customer as string

      console.log('💰 [WEBHOOK] invoice.paid:', { customerId, subscriptionId })

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const status = subscription.status === 'trialing' ? 'trialing' : 'active'
        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null

        console.log('📊 [WEBHOOK] Syncing subscription status:', { status, trialEnd })

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
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      console.log('❗ [WEBHOOK] invoice.payment_failed:', { customerId })

      const { data, error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'past_due' })
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
