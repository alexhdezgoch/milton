import { useState } from 'react'
import { Home, Tag, Search, Scissors, X, LogOut, CreditCard, Mail, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../hooks/useSubscription'

function LeftSidebar({
  onClose,
  activeNav,
  onNavChange
}) {
  const { user, profile, signOut, updateProfile } = useAuth()
  const { isTrialing, trialDaysRemaining, manageSubscription, isActive } = useSubscription()
  const [updatingDigest, setUpdatingDigest] = useState(false)

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'tags', icon: Tag, label: 'Tags' },
    { id: 'search', icon: Search, label: 'Search' },
  ]

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      console.error('Sign out failed:', error)
      return
    }
    onClose()
  }

  const handleManageSubscription = async () => {
    try {
      await manageSubscription()
    } catch (err) {
      console.error('Failed to open subscription portal:', err)
    }
  }

  const handleToggleDigest = async () => {
    setUpdatingDigest(true)
    try {
      await updateProfile({ weekly_digest_enabled: !profile?.weekly_digest_enabled })
    } catch (err) {
      console.error('Failed to update digest setting:', err)
    } finally {
      setUpdatingDigest(false)
    }
  }

  return (
    <aside className="w-[220px] h-full bg-bg-primary border-r border-border shadow-sidebar overflow-hidden">
      <div
        className="h-full overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex flex-col lg:min-h-full">
          {/* Logo */}
          <div className="px-4 py-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Scissors className="w-5 h-5 text-accent-rose transform -rotate-45" />
              </div>
              <span className="text-lg font-semibold text-accent-green tracking-tight">Milton</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 -mr-2 hover:bg-bg-secondary rounded-lg transition-colors active:bg-bg-tertiary"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onNavChange(item.id)}
                className={`sidebar-item ${activeNav === item.id ? 'sidebar-item-active' : ''}`}
              >
                <item.icon className="w-[18px] h-[18px]" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </nav>

          {/* Spacer - pushes bottom section down on desktop only */}
          <div className="hidden lg:block lg:flex-1" />

          {/* Bottom section: Subscription + Settings + Sign Out */}
          <div className="px-3 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-1 border-t border-border pt-3">
            {/* Subscription Status */}
            {isTrialing() && (
              <div className="mb-2">
                {trialDaysRemaining() <= 2 ? (
                  <div className="px-3 py-2 bg-amber-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <div>
                        <p className="text-xs font-medium text-amber-600">
                          Trial ending soon
                        </p>
                        <p className="text-xs text-amber-600/80">
                          Ends {profile?.trial_ends_at ? new Date(profile.trial_ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `in ${trialDaysRemaining()} days`}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-2 bg-accent-green/10 rounded-lg">
                    <p className="text-xs font-medium text-accent-green">
                      Trial: {trialDaysRemaining()} days left
                    </p>
                    <p className="text-xs text-accent-green/80">
                      Ends {profile?.trial_ends_at ? new Date(profile.trial_ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </p>
                  </div>
                )}
              </div>
            )}
            {/* Manage Subscription - show for anyone with stripe_customer_id (includes trialing users) */}
            {profile?.stripe_customer_id && (
              <button
                onClick={handleManageSubscription}
                className="sidebar-item w-full active:bg-bg-tertiary"
              >
                <CreditCard className="w-[18px] h-[18px]" />
                <span className="text-sm font-medium">Manage Subscription</span>
              </button>
            )}

            {/* Weekly Digest Toggle */}
            <button
              onClick={handleToggleDigest}
              disabled={updatingDigest}
              className="sidebar-item w-full justify-between active:bg-bg-tertiary"
            >
              <div className="flex items-center gap-2">
                <Mail className="w-[18px] h-[18px]" />
                <span className="text-sm font-medium">Weekly Digest</span>
              </div>
              <div className={`w-8 h-4 rounded-full transition-colors ${profile?.weekly_digest_enabled ? 'bg-accent-green' : 'bg-border'}`}>
                <div className={`w-3 h-3 bg-white rounded-full shadow-subtle transition-transform mt-0.5 ${profile?.weekly_digest_enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </button>

            {/* User Info */}
            <div className="px-3 py-2">
              <p className="text-xs text-text-muted truncate">
                {profile?.email || user?.email}
              </p>
            </div>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="sidebar-item w-full text-text-secondary hover:text-accent-rose active:text-accent-rose active:bg-accent-rose/10"
            >
              <LogOut className="w-[18px] h-[18px]" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default LeftSidebar
