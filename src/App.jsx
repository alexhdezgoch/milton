import { useState, useEffect } from 'react'
import { Menu, ArrowLeft } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthGuard from './components/auth/AuthGuard'
import SubscriptionGuard from './components/auth/SubscriptionGuard'
import LeftSidebar from './components/LeftSidebar'
import VideoDetailView from './components/VideoDetailView'
import LibraryView from './components/LibraryView'
import TagsView from './components/TagsView'
import SearchView from './components/SearchView'
import Toast from './components/shared/Toast'

function AppContent() {
  const { refreshProfile } = useAuth()
  const [selectedVideoId, setSelectedVideoId] = useState(null)
  const [activeNav, setActiveNav] = useState('home')
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)
  const [toast, setToast] = useState(null)

  // Handle OAuth callback params (Notion integration)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.has('notion_connected')) {
      setToast({ message: 'Notion connected successfully!', type: 'success' })
      refreshProfile()
      // Clean URL
      params.delete('notion_connected')
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname
      window.history.replaceState(null, '', newUrl)
    }

    if (params.has('notion_error')) {
      const error = params.get('notion_error')
      setToast({ message: `Notion connection failed: ${error}`, type: 'error' })
      // Clean URL
      params.delete('notion_error')
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname
      window.history.replaceState(null, '', newUrl)
    }
  }, [])

  // Lock body scroll when mobile sidebar is open (iOS Safari fix)
  useEffect(() => {
    if (leftSidebarOpen) {
      // Save scroll position and lock body (iOS Safari fix)
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
    }
  }, [leftSidebarOpen])

  const handleSelectVideo = (videoId) => {
    setSelectedVideoId(videoId)
  }

  const handleBackToLibrary = () => {
    setSelectedVideoId(null)
  }

  const handleNavChange = (nav) => {
    setActiveNav(nav)
    setSelectedVideoId(null)
    setLeftSidebarOpen(false)
  }

  const renderMainContent = () => {
    if (selectedVideoId) {
      return (
        <VideoDetailView
          videoId={selectedVideoId}
          onBack={handleBackToLibrary}
        />
      )
    }

    // Keep all views mounted but hidden to preserve state across navigation
    return (
      <>
        <div className={activeNav === 'home' ? 'contents' : 'hidden'}>
          <LibraryView onSelectVideo={handleSelectVideo} />
        </div>
        <div className={activeNav === 'tags' ? 'contents' : 'hidden'}>
          <TagsView onSelectVideo={handleSelectVideo} />
        </div>
        <div className={activeNav === 'search' ? 'contents' : 'hidden'}>
          <SearchView onSelectVideo={handleSelectVideo} />
        </div>
      </>
    )
  }

  const getMobileHeaderTitle = () => {
    if (selectedVideoId) {
      return 'Video'
    }
    switch (activeNav) {
      case 'tags':
        return 'Tags'
      case 'search':
        return 'Search'
      default:
        return 'Milton'
    }
  }

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden relative">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-bg-primary border-b border-border flex items-center justify-between px-4 lg:hidden z-40">
        {selectedVideoId ? (
          <button
            onClick={handleBackToLibrary}
            className="p-2 -ml-2 hover:bg-bg-secondary rounded-lg transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5 text-text-primary" />
            <span className="text-sm text-text-secondary">Back</span>
          </button>
        ) : (
          <button
            onClick={() => setLeftSidebarOpen(true)}
            className="p-2 -ml-2 hover:bg-bg-secondary rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-text-primary" />
          </button>
        )}
        <span className={`text-lg font-semibold tracking-tight ${selectedVideoId ? 'text-text-primary truncate max-w-[200px]' : 'text-accent-green'}`}>
          {getMobileHeaderTitle()}
        </span>
        <div className="w-16" />
      </div>

      {/* Left Sidebar Overlay (Mobile) */}
      {leftSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden touch-none"
          onClick={() => setLeftSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div className={`
        fixed lg:relative top-0 bottom-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:h-auto pointer-events-auto
        ${leftSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <LeftSidebar
          onClose={() => setLeftSidebarOpen(false)}
          activeNav={activeNav}
          onNavChange={handleNavChange}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 pt-14 lg:pt-0 overflow-auto">
        {renderMainContent()}
      </div>

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <SubscriptionGuard>
          <AppContent />
        </SubscriptionGuard>
      </AuthGuard>
    </AuthProvider>
  )
}

export default App
