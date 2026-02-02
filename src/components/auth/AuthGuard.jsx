import { useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { isConfigured } from '../../lib/supabase'
import LandingPage from '../LandingPage'
import LoginForm from './LoginForm'

export default function AuthGuard({ children }) {
  const { user, loading, authError } = useAuth()
  const [showLogin, setShowLogin] = useState(false)

  // Show setup message if Supabase isn't configured
  if (!isConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-subtle p-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl font-semibold text-text-primary">Setup Required</h1>
          </div>
          <p className="text-text-secondary mb-4">
            Milton needs to be connected to Supabase to work. Please create a <code className="bg-bg-secondary px-1.5 py-0.5 rounded text-sm">.env</code> file with your credentials:
          </p>
          <div className="bg-bg-secondary rounded-lg p-4 font-mono text-sm text-text-primary mb-4">
            <p>VITE_SUPABASE_URL=https://xxx.supabase.co</p>
            <p>VITE_SUPABASE_ANON_KEY=eyJ...</p>
          </div>
          <p className="text-sm text-text-muted">
            See SETUP.md for full instructions.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent-green" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  // Show auth errors
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-subtle p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-text-primary mb-2">Connection Error</h1>
          <p className="text-text-secondary mb-4">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    if (showLogin) {
      return <LoginForm onBack={() => setShowLogin(false)} />
    }
    return <LandingPage onGetStarted={() => setShowLogin(true)} />
  }

  return children
}
