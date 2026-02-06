import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

/**
 * Send auth session to the Milton Chrome extension
 */
async function sendSessionToExtension(session) {
  // Check if extension is installed (ID is injected by content script)
  const extensionId = window.MILTON_EXTENSION_ID ||
                      document.documentElement.dataset.miltonExtensionId
  if (!extensionId || !chrome?.runtime?.sendMessage) {
    console.log('[Milton] Extension not detected')
    return { success: false, error: 'Extension not installed' }
  }

  try {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        extensionId,
        {
          type: 'SET_AUTH_SESSION',
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: {
              id: session.user.id,
              email: session.user.email
            }
          }
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('[Milton] Extension message error:', chrome.runtime.lastError)
            resolve({ success: false, error: chrome.runtime.lastError.message })
          } else {
            console.log('[Milton] Session sent to extension:', response)
            resolve(response || { success: true })
          }
        }
      )
    })
  } catch (error) {
    console.error('[Milton] Failed to send session to extension:', error)
    return { success: false, error: error.message }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [extensionConnected, setExtensionConnected] = useState(false)
  const [extensionId, setExtensionId] = useState(null)
  const hasResolved = useRef(false)
  const extensionConnectionAttempted = useRef(false)

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

  // Listen for extension ID (runs once on mount)
  useEffect(() => {
    // Check if already available
    const existingId = window.MILTON_EXTENSION_ID ||
                       document.documentElement.dataset.miltonExtensionId
    if (existingId) {
      window.MILTON_EXTENSION_ID = existingId
      setExtensionId(existingId)
    }

    // Listen for postMessage from extension content script
    const handleMessage = (event) => {
      if (event.data?.type === 'MILTON_EXTENSION_ID' && event.data.extensionId) {
        window.MILTON_EXTENSION_ID = event.data.extensionId
        setExtensionId(event.data.extensionId)
      }
    }

    window.addEventListener('message', handleMessage)

    // Re-check after delay in case content script hasn't run yet
    const timeout = setTimeout(() => {
      const id = document.documentElement.dataset.miltonExtensionId
      if (id) {
        window.MILTON_EXTENSION_ID = id
        setExtensionId(id)
      }
    }, 500)

    return () => {
      window.removeEventListener('message', handleMessage)
      clearTimeout(timeout)
    }
  }, [])

  // Auto-sync session to extension when both user and extension are available
  useEffect(() => {
    if (!user || !extensionId || extensionConnected) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        sendSessionToExtension(session).then((result) => {
          if (result.success) {
            setExtensionConnected(true)
            console.log('[Milton] Session auto-synced to extension')
          }
        })
      }
    })
  }, [user, extensionId, extensionConnected])

  // Handle extension connection when ?connect_extension=true is in URL
  // Store the flag in sessionStorage so it persists through login flow
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('connect_extension')) {
      sessionStorage.setItem('milton_connect_extension', 'true')
      // Clean up the URL
      params.delete('connect_extension')
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname
      window.history.replaceState(null, '', newUrl)
    }
  }, [])

  // Actually connect once user is logged in
  useEffect(() => {
    if (extensionConnectionAttempted.current) return

    const shouldConnect = sessionStorage.getItem('milton_connect_extension')
    if (!shouldConnect) return

    if (!user) {
      // User not set yet - wait for next effect run
      return
    }

    // User is set, mark as attempted and clear flag before async work
    extensionConnectionAttempted.current = true
    sessionStorage.removeItem('milton_connect_extension')

    // Get current session and send to extension
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        sendSessionToExtension(session).then((result) => {
          if (result.success) {
            setExtensionConnected(true)
            console.log('[Milton] Extension connected successfully')
          } else {
            console.error('[Milton] Extension connection failed:', result.error)
          }
        })
      }
    })
  }, [user, loading])

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
      setExtensionConnected(false)

      // Also sign out from extension if connected
      const extensionId = window.MILTON_EXTENSION_ID
      if (extensionId && chrome?.runtime?.sendMessage) {
        try {
          chrome.runtime.sendMessage(extensionId, { type: 'CLEAR_AUTH_SESSION' })
        } catch (e) {
          // Ignore errors if extension is not available
        }
      }
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

  async function connectExtension() {
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { success: false, error: 'No session' }
    }

    const result = await sendSessionToExtension(session)
    if (result.success) {
      setExtensionConnected(true)
    }
    return result
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
    extensionConnected,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
    connectExtension,
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
