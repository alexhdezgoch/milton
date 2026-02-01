import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const contentType = req.headers.get('content-type') || ''

    // Handle webhook from Stripe
    if (contentType.includes('application/json') && req.headers.get('stripe-signature')) {
      return handleWebhook(req)
    }

    // Handle API calls from frontend
    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'create-checkout-session':
        return createCheckoutSession(body)
      case 'create-portal-session':
        return createPortalSession(body)
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function createCheckoutSession(body: { userId: string; returnUrl: string }) {
  const { userId, returnUrl } = body

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, stripe_customer_id')
    .eq('id', userId)
    .single()

  let customerId = profile?.stripe_customer_id

  // Create Stripe customer if needed (don't save to DB yet - webhook will save on checkout completion)
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email,
      metadata: { supabase_user_id: userId }
    })
    customerId = customer.id
  }

  // Get price ID from environment
  const priceId = Deno.env.get('STRIPE_PRICE_ID')
  if (!priceId) {
    throw new Error('STRIPE_PRICE_ID not configured')
  }

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
  const signature = req.headers.get('stripe-signature')!
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  const body = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err.message}`, {
      status: 400
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      const subscriptionId = session.subscription as string

      if (userId && subscriptionId) {
        // Get subscription to check if it's trialing
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const status = subscription.status === 'trialing' ? 'trialing' : 'active'
        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null

        await supabase
          .from('profiles')
          .update({
            subscription_status: status,
            stripe_customer_id: session.customer as string,
            trial_ends_at: trialEnd
          })
          .eq('id', userId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

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

      await supabase
        .from('profiles')
        .update({
          subscription_status: status,
          trial_ends_at: trialEnd
        })
        .eq('stripe_customer_id', customerId)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await supabase
        .from('profiles')
        .update({ subscription_status: 'canceled' })
        .eq('stripe_customer_id', customerId)
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
