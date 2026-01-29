import { useState } from 'react'
import { Menu, ArrowLeft } from 'lucide-react'
import LeftSidebar from './components/LeftSidebar'
import VideoDetailView from './components/VideoDetailView'
import LibraryView from './components/LibraryView'
import TagsView from './components/TagsView'
import SearchView from './components/SearchView'
import { videos, snips, tags, summaries } from './data/mockData'

function App() {
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [activeNav, setActiveNav] = useState('home')
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)

  const handleSelectVideo = (videoId) => {
    const video = videos.find(v => v.id === videoId)
    if (video) {
      setSelectedVideo(video)
    }
  }

  const handleBackToLibrary = () => {
    setSelectedVideo(null)
  }

  const handleNavChange = (nav) => {
    setActiveNav(nav)
    setSelectedVideo(null) // Clear selected video when navigating
    setLeftSidebarOpen(false)
  }

  const currentSnips = selectedVideo
    ? snips.filter(s => s.videoId === selectedVideo.id)
    : []

  const currentSummary = selectedVideo
    ? summaries.find(s => s.videoId === selectedVideo.id)
    : null

  const renderMainContent = () => {
    // If a video is selected, show the detail view
    if (selectedVideo) {
      return (
        <VideoDetailView
          video={selectedVideo}
          snips={currentSnips}
          summary={currentSummary}
          onBack={handleBackToLibrary}
        />
      )
    }

    // Otherwise show the appropriate view based on nav
    switch (activeNav) {
      case 'tags':
        return <TagsView tags={tags} videos={videos} onSelectVideo={handleSelectVideo} />
      case 'search':
        return <SearchView videos={videos} snips={snips} onSelectVideo={handleSelectVideo} />
      case 'home':
      default:
        return <LibraryView videos={videos} onSelectVideo={handleSelectVideo} />
    }
  }

  const getMobileHeaderTitle = () => {
    if (selectedVideo) {
      return selectedVideo.title
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
        {selectedVideo ? (
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
        <span className={`text-lg font-semibold tracking-tight ${selectedVideo ? 'text-text-primary truncate max-w-[200px]' : 'text-accent-green'}`}>
          {getMobileHeaderTitle()}
        </span>
        {selectedVideo ? (
          <span className="text-xs font-medium text-text-secondary bg-bg-secondary px-2 py-1 rounded-md">
            {currentSnips.length} Snips
          </span>
        ) : (
          <div className="w-16" />
        )}
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

export default App
