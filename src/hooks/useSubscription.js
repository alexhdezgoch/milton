import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createCheckoutSession, createPortalSession } from '../lib/stripe'

export function useSubscription() {
  const { user, profile, hasActiveSubscription, getTrialDaysRemaining, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const subscribe = async () => {
    if (!user) throw new Error('Not authenticated')

    setLoading(true)
    setError(null)

    try {
      await createCheckoutSession(user.id)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const manageSubscription = async () => {
    if (!profile?.stripe_customer_id) {
      throw new Error('No subscription to manage')
    }

    setLoading(true)
    setError(null)

    try {
      await createPortalSession(profile.stripe_customer_id)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getSubscriptionStatus = () => {
    if (!profile) return 'unknown'
    return profile.subscription_status
  }

  const isTrialing = () => {
    return profile?.subscription_status === 'trialing'
  }

  const isActive = () => {
    return hasActiveSubscription()
  }

  const trialDaysRemaining = () => {
    return getTrialDaysRemaining()
  }

  return {
    loading,
    error,
    subscribe,
    manageSubscription,
    getSubscriptionStatus,
    isTrialing,
    isActive,
    trialDaysRemaining,
    refreshProfile
  }
}
