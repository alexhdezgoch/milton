import { useState, useCallback, useEffect } from 'react'
import { Scissors, Check, Loader2, CreditCard, Mail } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { createCheckoutSession } from '../../lib/stripe'
import CheckoutModal from './CheckoutModal'

export default function SubscriptionGuard({ children }) {
  const { user, profile, hasActiveSubscription, getTrialDaysRemaining, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clientSecret, setClientSecret] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [checkoutReturning, setCheckoutReturning] = useState(false)

  const isActive = hasActiveSubscription()
  const trialDays = getTrialDaysRemaining()
  const isNewUser = !profile?.stripe_customer_id
  const trialExpired = profile?.subscription_status === 'trialing' && trialDays <= 0

  // Detect return from Stripe checkout (page reload with session_id in URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')

    if (sessionId) {
      setCheckoutReturning(true)

      // Clear session_id from URL
      window.history.replaceState({}, '', window.location.pathname)

      // Poll for profile update (webhook takes 1-5 seconds)
      const pollForUpdate = async () => {
        const maxAttempts = 10
        const pollInterval = 1500

        for (let i = 0; i < maxAttempts; i++) {
          await new Promise(resolve => setTimeout(resolve, pollInterval))
          await refreshProfile?.()
        }
        setCheckoutReturning(false)
      }

      pollForUpdate()
    }
  }, [refreshProfile])

  // Show loading state while processing checkout return
  if (checkoutReturning) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent-green mx-auto mb-4" />
          <p className="text-text-primary font-medium">Processing your payment...</p>
          <p className="text-text-secondary text-sm mt-1">This will only take a moment</p>
        </div>
      </div>
    )
  }

  // If subscription is active or trial is valid, render children
  if (isActive) {
    return children
  }

  const handleSubscribe = async () => {
    setLoading(true)
    setError('')
    try {
      const secret = await createCheckoutSession(user.id)
      setClientSecret(secret)
      setShowModal(true)
    } catch (err) {
      setError(err.message || 'Failed to start checkout')
    } finally {
      setLoading(false)
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    setClientSecret(null)
  }

  const handleCheckoutComplete = useCallback(async () => {
    setShowModal(false)
    setClientSecret(null)
    setLoading(true) // Show loading state while waiting for webhook

    // Poll for profile update (webhook takes 1-5 seconds)
    const maxAttempts = 10
    const pollInterval = 1500 // 1.5 seconds

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval))
      await refreshProfile?.()
      // Component will re-render if hasActiveSubscription() returns true
    }

    setLoading(false)
  }, [refreshProfile])

  // New user - hasn't set up payment yet
  if (isNewUser) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
          <div className="w-full max-w-lg">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-10 h-10 bg-video-dark rounded-lg flex items-center justify-center">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <span className="font-serif text-2xl font-semibold tracking-tighter text-text-primary">
                Milton
              </span>
            </div>

            {/* Trial Setup Card */}
            <div className="bg-white rounded-xl shadow-subtle overflow-hidden">
              <div className="bg-gradient-to-r from-accent-green to-emerald-600 px-8 py-6 text-white">
                <h1 className="text-2xl font-serif font-semibold mb-2">
                  Start Your 7-Day Free Trial
                </h1>
                <p className="text-white/90">
                  Add your payment method to begin. You won't be charged until your trial ends.
                </p>
              </div>

              <div className="p-8">
                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
                    {error}
                  </div>
                )}

                {/* Trial Info */}
                <div className="bg-accent-green/5 border border-accent-green/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-green/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-accent-green" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">No charge today</p>
                      <p className="text-sm text-text-secondary">$10/month after 7-day trial</p>
                    </div>
                  </div>
                </div>

                {/* Email Reminder Notice */}
                <div className="flex items-center gap-3 mb-6 text-text-secondary">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm">We'll email you 2 days before your trial ends</p>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {[
                    'Unlimited video saves',
                    'AI-powered snips & summaries',
                    'Chat with your videos',
                    'Weekly digest emails',
                    'Tags & organization',
                    'Full transcript access'
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-accent-green/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-accent-green" />
                      </div>
                      <span className="text-text-primary">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Start Trial Button */}
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full bg-accent-green text-white py-3 rounded-lg font-medium hover:bg-accent-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                  Start Free Trial
                </button>

                {/* Cancel Policy */}
                <p className="text-center text-text-primary text-sm font-medium mt-4">
                  Cancel anytime before your trial ends — no charge
                </p>
                <p className="text-center text-text-muted text-xs mt-2">
                  Secure payment powered by Stripe
                </p>
              </div>
            </div>

            {/* Email */}
            <p className="text-center text-text-secondary text-sm mt-6">
              Signed in as {profile?.email || user?.email}
            </p>
          </div>
        </div>

        {/* Checkout Modal */}
        {showModal && clientSecret && (
          <CheckoutModal
            clientSecret={clientSecret}
            onClose={handleModalClose}
            onComplete={handleCheckoutComplete}
          />
        )}
      </>
    )
  }

  // Trial expired or subscription ended
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-video-dark rounded-lg flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <span className="font-serif text-2xl font-semibold tracking-tighter text-text-primary">
              Milton
            </span>
          </div>

          {/* Subscription Card */}
          <div className="bg-white rounded-xl shadow-subtle overflow-hidden">
            <div className="bg-gradient-to-r from-accent-green to-emerald-600 px-8 py-6 text-white">
              <h1 className="text-2xl font-serif font-semibold mb-2">
                {trialExpired
                  ? 'Your Trial Has Ended'
                  : 'Subscribe to Continue'}
              </h1>
              <p className="text-white/90">
                Unlock unlimited access to all Milton features
              </p>
            </div>

            <div className="p-8">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
                  {error}
                </div>
              )}

              {/* Price */}
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-text-primary">$10</span>
                  <span className="text-text-secondary">/month</span>
                </div>
                <p className="text-text-muted mt-1">Cancel anytime</p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                {[
                  'Unlimited video saves',
                  'AI-powered snips & summaries',
                  'Chat with your videos',
                  'Weekly digest emails',
                  'Tags & organization',
                  'Full transcript access'
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent-green/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-accent-green" />
                    </div>
                    <span className="text-text-primary">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Subscribe Button */}
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full bg-accent-green text-white py-3 rounded-lg font-medium hover:bg-accent-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CreditCard className="w-5 h-5" />
                )}
                Subscribe Now
              </button>

              {/* Security Note */}
              <p className="text-center text-text-muted text-sm mt-4">
                Secure payment powered by Stripe
              </p>
            </div>
          </div>

          {/* Email */}
          <p className="text-center text-text-secondary text-sm mt-6">
            Signed in as {profile?.email || user?.email}
          </p>
        </div>
      </div>

      {/* Checkout Modal */}
      {showModal && clientSecret && (
        <CheckoutModal
          clientSecret={clientSecret}
          onClose={handleModalClose}
          onComplete={handleCheckoutComplete}
        />
      )}
    </>
  )
}
