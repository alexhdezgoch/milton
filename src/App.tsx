import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import RightSidebar from './components/RightSidebar';
import MainPanel from './components/MainPanel';
import MobileNav from './components/MobileNav';
import { mockTranscript } from './data/mockData';
import { Scissors, Youtube } from 'lucide-react';
import { useState } from 'react';

function MiltonApp() {
  const {
    videos,
    snips,
    selectedVideoId,
    setSelectedVideoId,
    toggleSnipFavorite,
    addSnip,
    mobileView,
    setMobileView,
  } = useApp();

  const selectedVideo = videos.find(v => v.id === selectedVideoId);
  const videoSnips = snips.filter(s => s.videoId === selectedVideoId);

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop layout - 3 panels */}
      <div className="hidden lg:flex h-screen">
        <Sidebar
          videos={videos}
          selectedVideoId={selectedVideoId}
          onVideoSelect={setSelectedVideoId}
        />
        <MainContent
          video={selectedVideo || null}
          transcript={mockTranscript}
          onSnip={addSnip}
          onAddUrl={(url) => console.log('Adding:', url)}
        />
        <RightSidebar
          video={selectedVideo || null}
          snips={videoSnips}
          onToggleFavorite={toggleSnipFavorite}
        />
      </div>

      {/* Mobile layout */}
      <MobileLayout
        videos={videos}
        selectedVideo={selectedVideo || null}
        selectedVideoId={selectedVideoId}
        snips={videoSnips}
        mobileView={mobileView}
        setMobileView={setMobileView}
        onVideoSelect={setSelectedVideoId}
        onSnip={addSnip}
        onToggleFavorite={toggleSnipFavorite}
      />
    </div>
  );
}

function MobileLayout({
  videos,
  selectedVideo,
  selectedVideoId,
  snips,
  mobileView,
  setMobileView,
  onVideoSelect,
  onSnip,
  onToggleFavorite,
}: {
  videos: any[];
  selectedVideo: any;
  selectedVideoId: string | null;
  snips: any[];
  mobileView: 'library' | 'player';
  setMobileView: (view: 'library' | 'player') => void;
  onVideoSelect: (id: string) => void;
  onSnip: () => void;
  onToggleFavorite: (id: string) => void;
}) {
  const [url, setUrl] = useState('');

  return (
    <div className="lg:hidden min-h-screen flex flex-col pb-16">
      {/* Header */}
      <header className="flex items-center gap-2 px-4 py-3 border-b border-[#E5E7EB]">
        <Scissors className="w-5 h-5 text-[#EC4899]" />
        <span className="text-base font-semibold text-[#065F46]">Milton</span>
      </header>

      {mobileView === 'library' ? (
        <div className="flex-1 overflow-y-auto">
          {/* URL Input */}
          <div className="p-4 border-b border-[#E5E7EB]">
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Paste YouTube URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm border border-[#E5E7EB]
                  placeholder-[#9CA3AF] focus:outline-none focus:border-[#065F46]"
              />
              <button className="px-4 py-2 rounded-lg text-sm font-medium bg-[#065F46] text-white">
                + Add
              </button>
            </div>
          </div>

          {/* Video list */}
          <div>
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => {
                  onVideoSelect(video.id);
                  setMobileView('player');
                }}
                className={`w-full text-left px-4 py-3 border-b border-[#E5E7EB] flex gap-3
                  ${selectedVideoId === video.id ? 'bg-[#ECFDF5]' : ''}`}
              >
                <div className="w-20 shrink-0">
                  <div className="aspect-video rounded bg-gradient-to-br from-gray-200 to-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-[#111827] line-clamp-2">{video.title}</h4>
                  <div className="mt-1.5 h-1 rounded-full bg-[#E5E7EB] overflow-hidden">
                    <div className="h-full bg-[#EC4899]" style={{ width: `${video.progress}%` }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {selectedVideo ? (
            <MainPanel
              video={selectedVideo}
              snips={snips}
              transcript={mockTranscript}
              onSnip={onSnip}
              onToggleFavorite={onToggleFavorite}
              onAddUrl={(url: string) => console.log('Adding:', url)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <Youtube className="w-12 h-12 mx-auto mb-3 text-[#9CA3AF]" />
                <p className="text-sm text-[#9CA3AF]">Select a video</p>
              </div>
            </div>
          )}
        </div>
      )}

      <MobileNav activeView={mobileView} onViewChange={setMobileView} />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <MiltonApp />
    </AppProvider>
  );
}

export default App;
