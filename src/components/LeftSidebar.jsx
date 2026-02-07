import { useState, useEffect } from 'react'
import { Home, Tag, Search, Scissors, X, LogOut, CreditCard, Mail, AlertTriangle, Chrome, Check, Cloud, CloudOff, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { supabase } from '../lib/supabase'

function LeftSidebar({
  onClose,
  activeNav,
  onNavChange
}) {
  const { user, profile, signOut, updateProfile, refreshProfile, extensionConnected, connectExtension } = useAuth()
  const { isTrialing, trialDaysRemaining, manageSubscription, isActive } = useSubscription()
  const [updatingDigest, setUpdatingDigest] = useState(false)
  const [extensionInstalled, setExtensionInstalled] = useState(false)
  const [connectingExtension, setConnectingExtension] = useState(false)
  const [syncingNotion, setSyncingNotion] = useState(false)
  const [disconnectingNotion, setDisconnectingNotion] = useState(false)

  // Check if extension is installed
  useEffect(() => {
    const checkExtension = () => {
      // Check window variable, data attribute, or already set
      const id = window.MILTON_EXTENSION_ID ||
                 document.documentElement.dataset.miltonExtensionId
      if (id) {
        window.MILTON_EXTENSION_ID = id
        setExtensionInstalled(true)
      }
    }

    // Listen for postMessage from extension content script
    const handleMessage = (event) => {
      if (event.data?.type === 'MILTON_EXTENSION_ID' && event.data.extensionId) {
        window.MILTON_EXTENSION_ID = event.data.extensionId
        setExtensionInstalled(true)
      }
    }

    window.addEventListener('message', handleMessage)
    checkExtension()
    // Re-check after a short delay in case the content script hasn't run yet
    const timeout = setTimeout(checkExtension, 500)

    return () => {
      window.removeEventListener('message', handleMessage)
      clearTimeout(timeout)
    }
  }, [])

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

  const handleConnectExtension = async () => {
    setConnectingExtension(true)
    try {
      const result = await connectExtension()
      if (!result.success) {
        console.error('Failed to connect extension:', result.error)
      }
    } catch (err) {
      console.error('Failed to connect extension:', err)
    } finally {
      setConnectingExtension(false)
    }
  }

  const handleConnectNotion = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await supabase.functions.invoke('notion-auth', {
        body: { returnUrl: window.location.origin },
        headers: { Authorization: `Bearer ${session.access_token}` }
      })

      if (response.error) {
        console.error('Failed to start Notion OAuth:', response.error)
        return
      }

      // Redirect to Notion OAuth
      window.location.href = response.data.url
    } catch (err) {
      console.error('Failed to connect Notion:', err)
    }
  }

  const handleSyncNotion = async () => {
    setSyncingNotion(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await supabase.functions.invoke('notion-sync', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (response.error) {
        console.error('Failed to sync Notion:', response.error)
      } else {
        await refreshProfile()
      }
    } catch (err) {
      console.error('Failed to sync Notion:', err)
    } finally {
      setSyncingNotion(false)
    }
  }

  const handleDisconnectNotion = async () => {
    if (!confirm('Disconnect Notion? Your synced pages will remain in Notion.')) {
      return
    }

    setDisconnectingNotion(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await supabase.functions.invoke('notion-disconnect', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (response.error) {
        console.error('Failed to disconnect Notion:', response.error)
      } else {
        await refreshProfile()
      }
    } catch (err) {
      console.error('Failed to disconnect Notion:', err)
    } finally {
      setDisconnectingNotion(false)
    }
  }

  const formatLastSynced = (date) => {
    if (!date) return 'Never'
    const d = new Date(date)
    const now = new Date()
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <aside className="w-[220px] h-full bg-bg-primary border-r border-border shadow-sidebar flex flex-col">
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

          {/* Bottom section: Subscription + Settings + Sign Out */}
          <div className="px-3 mt-auto pb-6 space-y-1 border-t border-border pt-3">
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

            {/* Notion Sync */}
            {profile?.notion_sync_enabled ? (
              <>
                <div className="sidebar-item w-full text-accent-green cursor-default">
                  <Cloud className="w-[18px] h-[18px]" />
                  <span className="text-sm font-medium">Notion Connected</span>
                </div>
                <button
                  onClick={handleSyncNotion}
                  disabled={syncingNotion}
                  className="sidebar-item w-full ml-4 text-xs active:bg-bg-tertiary"
                >
                  <RefreshCw className={`w-[14px] h-[14px] ${syncingNotion ? 'animate-spin' : ''}`} />
                  <span>{syncingNotion ? 'Syncing...' : 'Sync Now'}</span>
                </button>
                <button
                  onClick={handleDisconnectNotion}
                  disabled={disconnectingNotion}
                  className="sidebar-item w-full ml-4 text-xs text-text-muted hover:text-text-secondary active:bg-bg-tertiary"
                >
                  <CloudOff className="w-[14px] h-[14px]" />
                  <span>{disconnectingNotion ? 'Disconnecting...' : 'Disconnect'}</span>
                </button>
                <p className="text-xs text-text-muted px-3">
                  Last sync: {formatLastSynced(profile?.notion_last_synced_at)}
                </p>
              </>
            ) : (
              <button
                onClick={handleConnectNotion}
                className="sidebar-item w-full active:bg-bg-tertiary"
              >
                <Cloud className="w-[18px] h-[18px]" />
                <span className="text-sm font-medium">Connect Notion</span>
              </button>
            )}

            {/* Chrome Extension */}
            {extensionInstalled ? (
              extensionConnected ? (
                <div className="sidebar-item w-full text-accent-green cursor-default">
                  <Check className="w-[18px] h-[18px]" />
                  <span className="text-sm font-medium">Extension Synced</span>
                </div>
              ) : (
                <button
                  onClick={handleConnectExtension}
                  disabled={connectingExtension}
                  className="sidebar-item w-full active:bg-bg-tertiary"
                >
                  <Chrome className="w-[18px] h-[18px]" />
                  <span className="text-sm font-medium">
                    {connectingExtension ? 'Connecting...' : 'Sync Extension'}
                  </span>
                </button>
              )
            ) : (
              <a
                href="https://chrome.google.com/webstore"
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-item w-full"
              >
                <Chrome className="w-[18px] h-[18px]" />
                <span className="text-sm font-medium">Get Extension</span>
              </a>
            )}

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
    </aside>
  )
}

export default LeftSidebar
