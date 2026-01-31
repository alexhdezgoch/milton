import { loadStripe } from '@stripe/stripe-js'
import { supabase } from './supabase'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

let stripePromise = null

export function getStripe() {
  if (!stripePromise && stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey)
  }
  return stripePromise
}

export async function createCheckoutSession(userId) {
  const { data, error } = await supabase.functions.invoke('stripe-webhook', {
    body: {
      action: 'create-checkout-session',
      userId,
      successUrl: `${window.location.origin}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/subscribe`
    }
  })

  if (error) throw error

  const stripe = await getStripe()
  if (!stripe) throw new Error('Stripe not initialized')

  const { error: stripeError } = await stripe.redirectToCheckout({
    sessionId: data.sessionId
  })

  if (stripeError) throw stripeError
}

export async function createPortalSession(customerId) {
  const { data, error } = await supabase.functions.invoke('stripe-webhook', {
    body: {
      action: 'create-portal-session',
      customerId,
      returnUrl: window.location.origin
    }
  })

  if (error) throw error

  window.location.href = data.url
}
