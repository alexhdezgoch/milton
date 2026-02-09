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
      returnUrl: window.location.origin
    }
  })

  if (error) throw error

  return data.clientSecret
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

export async function verifyCheckoutSession(sessionId, userId) {
  const { data, error } = await supabase.functions.invoke('stripe-webhook', {
    body: {
      action: 'verify-checkout-session',
      sessionId,
      userId
    }
  })

  if (error) throw error

  return data
}
