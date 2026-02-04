import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const hasResolved = useRef(false)

  useEffect(() => {
    let mounted = true

    // Clean up OAuth hash from URL after processing
    if (window.location.hash && window.location.hash.includes('access_token')) {
      setTimeout(() => {
        window.history.replaceState(null, '', window.location.pathname)
      }, 100)
    }

    // Timeout protection - use ref to avoid stale closure
    const timeout = setTimeout(() => {
      if (mounted && !hasResolved.current) {
        console.error('Auth initialization timeout')
        setAuthError('Authentication timed out. Please refresh the page.')
        setLoading(false)
      }
    }, 10000)

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      hasResolved.current = true
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }).catch((error) => {
      if (error.name !== 'AbortError') {
        console.error('Failed to get session:', error)
      }
      if (mounted) {
        hasResolved.current = true
        setAuthError(error.message)
        setLoading(false)
      }
    })

    // Listen for auth changes — kept synchronous to avoid deadlock
    // (supabase/auth-js#762: async callbacks block subsequent Supabase calls)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return
        setUser(session?.user ?? null)
        if (session?.user) {
          // Defer async work outside the callback to avoid deadlock
          setTimeout(() => {
            if (mounted) fetchProfile(session.user.id)
          }, 0)
        } else {
          setProfile(null)
          setLoading(false)
        }

        // Bump refreshKey when session is re-established (tab return) or token refreshed,
        // so hooks re-fetch data with the fresh token. Guard with hasResolved to skip
        // the initial SIGNED_IN fired during page load.
        if (event === 'TOKEN_REFRESHED' || (event === 'SIGNED_IN' && hasResolved.current)) {
          setRefreshKey(k => k + 1)
        }

        if (!hasResolved.current) {
          hasResolved.current = true
        }
      }
    )

    // No custom visibilitychange handler — Supabase handles token refresh
    // internally when autoRefreshToken is true. SIGNED_IN fires on tab refocus,
    // TOKEN_REFRESHED fires on token renewal, both handled above.

    return () => {
      mounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Handle "no profile" as a valid state (new user)
        if (error.code === 'PGRST116') {
          setProfile(null)
          setAuthError(null)
          return
        }
        throw error
      }
      setProfile(data)
      setAuthError(null)
    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) return
      console.error('Error fetching profile:', error)
      setAuthError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function signUp(email, password, displayName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName }
      }
    })
    return { data, error }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  async function signInWithGoogle() {
    // Use the configured site URL for redirects, not window.location
    const redirectUrl = import.meta.env.VITE_SITE_URL || window.location.origin

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    })
    return { data, error }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setProfile(null)
    }
    return { error }
  }

  async function resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    return { data, error }
  }

  async function updateProfile(updates) {
    if (!user) return { error: { message: 'Not authenticated' } }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) {
      setProfile(data)
    }
    return { data, error }
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const hasActiveSubscription = () => {
    if (!profile) return false
    if (profile.subscription_status === 'active') return true
    // Trialing users must have stripe_customer_id (entered card via checkout)
    if (profile.subscription_status === 'trialing' && profile.stripe_customer_id && profile.trial_ends_at) {
      return new Date(profile.trial_ends_at) > new Date()
    }
    return false
  }

  const getTrialDaysRemaining = () => {
    if (!profile?.trial_ends_at) return 0
    const trialEnd = new Date(profile.trial_ends_at)
    const now = new Date()
    const diff = trialEnd - now
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const value = {
    user,
    profile,
    loading,
    authError,
    refreshKey,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
    hasActiveSubscription,
    getTrialDaysRemaining
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
