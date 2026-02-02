import { useState } from 'react'
import { Menu, ArrowLeft } from 'lucide-react'
import { AuthProvider } from './context/AuthContext'
import AuthGuard from './components/auth/AuthGuard'
import SubscriptionGuard from './components/auth/SubscriptionGuard'
import LeftSidebar from './components/LeftSidebar'
import VideoDetailView from './components/VideoDetailView'
import LibraryView from './components/LibraryView'
import TagsView from './components/TagsView'
import SearchView from './components/SearchView'

function AppContent() {
  const [selectedVideoId, setSelectedVideoId] = useState(null)
  const [activeNav, setActiveNav] = useState('home')
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)

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
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setLeftSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        ${leftSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <LeftSidebar
          onClose={() => setLeftSidebarOpen(false)}
          activeNav={activeNav}
          onNavChange={handleNavChange}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 pt-14 lg:pt-0 overflow-hidden">
        {renderMainContent()}
      </div>
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
