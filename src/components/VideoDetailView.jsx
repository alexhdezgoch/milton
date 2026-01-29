import { useState } from 'react'
import { ArrowLeft, Plus, Play, ChevronDown, ExternalLink, Star, ChevronUp, Sparkles, X } from 'lucide-react'

function VideoDetailView({ video, snips, summary, onBack }) {
  const [url, setUrl] = useState('')
  const [showTranscript, setShowTranscript] = useState(false)
  const [activeTab, setActiveTab] = useState('snips')
  const [snipsPanelOpen, setSnipsPanelOpen] = useState(false)
  const [summaryPanelOpen, setSummaryPanelOpen] = useState(false)

  return (
    <div className="flex h-full">
      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto bg-bg-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Library</span>
          </button>

          {/* URL Input */}
          <div className="flex gap-3 mb-8">
            <div className="flex-1 relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a YouTube URL..."
                className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green transition-all"
              />
            </div>
            <button className="px-5 py-3 bg-accent-green text-white text-sm font-medium rounded-xl hover:bg-accent-green/90 transition-colors shadow-subtle flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {/* Video Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs text-text-muted font-medium">youtube.com</span>
            </div>
            <h1 className="font-serif text-2xl font-semibold text-text-primary tracking-tighter leading-tight mb-2">
              {video.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <span>{video.author}</span>
              <span className="text-text-muted">•</span>
              <span>{video.duration}</span>
            </div>
          </div>

          {/* Video Player */}
          <div className="relative aspect-video bg-video-dark rounded-2xl overflow-hidden shadow-medium mb-4">
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors group">
                <Play className="w-8 h-8 text-white fill-white ml-1 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div
                className="h-full bg-accent-rose"
                style={{ width: `${video.progress}%` }}
              />
            </div>

            {/* Time Indicator */}
            <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/60 rounded text-xs text-white font-medium">
              {formatProgress(video.progress, video.duration)} / {video.duration}
            </div>
          </div>

          {/* SNIP Button */}
          <button className="w-full py-4 bg-accent-rose text-white text-sm font-semibold rounded-xl hover:bg-accent-rose/90 transition-colors shadow-medium tracking-wide">
            SNIP
          </button>

          {/* Transcript Toggle */}
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <span>View transcript</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showTranscript ? 'rotate-180' : ''}`} />
          </button>

          {/* Transcript Panel */}
          {showTranscript && (
            <div className="mt-2 p-4 bg-bg-secondary rounded-xl border border-border">
              <div className="space-y-3 text-sm text-text-secondary">
                <p><span className="text-accent-rose font-medium mr-2">0:00</span>Welcome back to the channel. Today we're diving deep into the principles of product design...</p>
                <p><span className="text-accent-rose font-medium mr-2">0:32</span>The first thing to understand is that great design is invisible. Users shouldn't have to think about how to use your product...</p>
                <p><span className="text-accent-rose font-medium mr-2">1:15</span>Let me show you an example. Notice how this interface guides your eye naturally from left to right...</p>
                <p><span className="text-accent-rose font-medium mr-2">2:03</span>Cognitive load is the enemy of good UX. Every decision you ask a user to make depletes their mental energy...</p>
              </div>
            </div>
          )}

          {/* Mobile Snips Panel */}
          <div className="lg:hidden mt-6">
            <button
              onClick={() => setSnipsPanelOpen(!snipsPanelOpen)}
              className="w-full flex items-center justify-between p-4 bg-bg-secondary rounded-xl border border-border"
            >
              <span className="text-sm font-semibold text-text-primary">
                Snips ({snips.length})
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${snipsPanelOpen ? 'rotate-180' : ''}`} />
            </button>
            {snipsPanelOpen && (
              <div className="mt-2 p-4 bg-bg-secondary rounded-xl border border-border">
                <SnipsContent snips={snips} />
              </div>
            )}
          </div>

          {/* Mobile Summary Panel */}
          {summary && (
            <div className="lg:hidden mt-4">
              <button
                onClick={() => setSummaryPanelOpen(!summaryPanelOpen)}
                className="w-full flex items-center justify-between p-4 bg-bg-secondary rounded-xl border border-border"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">Summary</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-bg-primary rounded text-[10px] font-medium text-text-muted">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${summaryPanelOpen ? 'rotate-180' : ''}`} />
              </button>
              {summaryPanelOpen && (
                <div className="mt-2 p-4 bg-bg-secondary rounded-xl border border-border">
                  <SummaryContent summary={summary} />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar - Desktop Only */}
      <aside className="hidden lg:flex w-[320px] xl:w-[340px] h-screen bg-bg-primary border-l border-border flex-col shadow-sidebar-right">
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('snips')}
            className={`tab-item ${activeTab === 'snips' ? 'tab-item-active' : ''}`}
          >
            Snips <span className="ml-1 text-text-muted">({snips.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`tab-item ${activeTab === 'summary' ? 'tab-item-active' : ''}`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`tab-item ${activeTab === 'info' ? 'tab-item-active' : ''}`}
          >
            Info
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`tab-item ${activeTab === 'chat' ? 'tab-item-active' : ''}`}
          >
            Chat
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {activeTab === 'snips' && <SnipsTab snips={snips} />}
          {activeTab === 'summary' && <SummaryTab summary={summary} />}
          {activeTab === 'info' && <InfoTab video={video} />}
          {activeTab === 'chat' && <ChatTab />}
        </div>
      </aside>
    </div>
  )
}

function SnipsContent({ snips }) {
  return (
    <div className="space-y-4">
      {snips.map((snip, index) => (
        <SnipCard key={snip.id} snip={snip} isLast={index === snips.length - 1} />
      ))}
      {snips.length === 0 && (
        <p className="text-sm text-text-muted text-center py-4">No snips yet</p>
      )}
    </div>
  )
}

function SnipsTab({ snips }) {
  return (
    <div className="p-4">
      {snips.map((snip, index) => (
        <SnipCard key={snip.id} snip={snip} isLast={index === snips.length - 1} />
      ))}
      {snips.length === 0 && (
        <p className="text-sm text-text-muted text-center py-8">No snips yet. Click SNIP while watching to create one.</p>
      )}
    </div>
  )
}

function SummaryContent({ summary }) {
  return (
    <div className="space-y-6">
      {/* Main Point */}
      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Main Point</h4>
        <p className="text-sm text-text-primary leading-relaxed font-medium">
          {summary.mainPoint}
        </p>
      </div>

      {/* Key Takeaways */}
      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Key Takeaways</h4>
        <ul className="space-y-3">
          {summary.keyTakeaways.map((takeaway, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-text-secondary leading-relaxed">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-green/10 text-accent-green text-xs font-semibold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span>{takeaway}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function SummaryTab({ summary }) {
  if (!summary) {
    return (
      <div className="p-4">
        <div className="h-full flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-sm text-text-secondary mb-1">No summary available</p>
            <p className="text-xs text-text-muted">Summary will be generated after processing</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* AI Generated Indicator */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-accent-green/10 rounded-md">
          <Sparkles className="w-3.5 h-3.5 text-accent-green" />
          <span className="text-xs font-medium text-accent-green">AI-generated summary</span>
        </div>
      </div>

      <SummaryContent summary={summary} />
    </div>
  )
}

function SnipCard({ snip, isLast }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className={`pb-4 ${!isLast ? 'mb-4 border-b border-border' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-base font-semibold text-text-primary tracking-tight leading-snug">
            {snip.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-medium text-accent-rose">{snip.timestamp}</span>
            {snip.aiGenerated && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-bg-secondary rounded text-[10px] font-medium text-text-muted">
                <Sparkles className="w-2.5 h-2.5" />
                By AI
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className={`p-1.5 rounded-lg hover:bg-bg-secondary transition-colors ${snip.starred ? 'text-amber-400' : 'text-text-muted'}`}>
            <Star className={`w-4 h-4 ${snip.starred ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-bg-secondary transition-colors text-text-muted"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bullets */}
      {expanded && (
        <ul className="space-y-1.5 mt-3">
          {snip.bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary leading-relaxed">
              <span className="mt-2 w-1 h-1 rounded-full bg-text-muted flex-shrink-0" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function InfoTab({ video }) {
  return (
    <div className="p-4">
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Description</h4>
          <p className="text-sm text-text-secondary leading-relaxed">
            {video.description || 'No description available.'}
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Channel</h4>
          <p className="text-sm text-text-primary">{video.author}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Duration</h4>
          <p className="text-sm text-text-secondary">{video.duration}</p>
        </div>
        {video.tags && video.tags.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {video.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-bg-secondary rounded-md text-xs font-medium text-text-secondary">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ChatTab() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-sm text-text-secondary mb-1">Ask questions about this video</p>
            <p className="text-xs text-text-muted">AI will use the transcript to answer</p>
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-border">
        <div className="relative">
          <input
            type="text"
            placeholder="Ask a question..."
            className="w-full px-4 py-3 pr-12 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green transition-all"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-accent-green hover:bg-accent-green/10 rounded-lg transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function formatProgress(progress, duration) {
  const [min, sec] = duration.split(':').map(Number)
  const totalSeconds = min * 60 + sec
  const currentSeconds = Math.floor((progress / 100) * totalSeconds)
  const currentMin = Math.floor(currentSeconds / 60)
  const currentSec = currentSeconds % 60
  return `${currentMin}:${currentSec.toString().padStart(2, '0')}`
}

export default VideoDetailView
