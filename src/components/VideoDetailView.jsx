import { useState, useRef, useCallback, useEffect } from 'react'
import { ArrowLeft, Plus, ChevronDown, ExternalLink, Star, ChevronUp, Sparkles, Loader2, Send, Trash2, RefreshCw, Quote, User, MoreVertical, Maximize2, Wand2, Search, AlertCircle, Play, Share2, Tag as TagIcon, Check } from 'lucide-react'
import YouTubePlayer from './shared/YouTubePlayer'
import { ErrorToast, useErrorToast } from './shared/ErrorToast'
import TagPicker from './shared/TagPicker'
import { useVideo } from '../hooks/useVideos'
import { useSnips } from '../hooks/useSnips'
import { useChat } from '../hooks/useChat'
import { useTags } from '../hooks/useTags'
import { formatDuration } from '../services/youtube'
import { getSummary } from '../services/api'

function VideoDetailView({ videoId, onBack }) {
  const [showTranscript, setShowTranscript] = useState(false)
  const [activeTab, setActiveTab] = useState('snips')
  const [snipsPanelOpen, setSnipsPanelOpen] = useState(false)
  const [summaryPanelOpen, setSummaryPanelOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [snipping, setSnipping] = useState(false)
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryError, setSummaryError] = useState(null)
  const [retryingTranscript, setRetryingTranscript] = useState(false)
  const [transcriptError, setTranscriptError] = useState(null)
  const [transcriptSearch, setTranscriptSearch] = useState('')

  const playerRef = useRef(null)
  const transcriptRef = useRef(null)

  const { video, loading: videoLoading, updateVideo, retryTranscript, retrySummary } = useVideo(videoId)
  const {
    snips,
    loading: snipsLoading,
    error: snipsError,
    generatingSnipAt,
    createSnip,
    toggleStar,
    deleteSnip,
    rewriteSnip,
    expandSnip,
    clearError: clearSnipsError
  } = useSnips(videoId)
  const {
    messages,
    sending,
    error: chatError,
    lastFailedMessage,
    sendMessage,
    retryLastMessage,
    clearHistory,
    clearError: clearChatError
  } = useChat(videoId)
  const {
    tags: availableTags,
    createTag,
    addTagToVideo,
    removeTagFromVideo,
    addTagToSnip,
    removeTagFromSnip
  } = useTags()

  const { error: toastError, showError, clearError: clearToastError, ErrorToastComponent } = useErrorToast()

  // Local state for video tags (to update UI immediately)
  const [videoTags, setVideoTags] = useState([])

  // Sync video tags when video loads
  useEffect(() => {
    if (video?.tags) {
      setVideoTags(video.tags)
    }
  }, [video?.tags])

  const handleAddTagToVideo = async (tagId) => {
    const tag = availableTags.find(t => t.id === tagId)
    if (tag) {
      setVideoTags(prev => [...prev, tag])
      await addTagToVideo(videoId, tagId)
    }
  }

  const handleRemoveTagFromVideo = async (tagId) => {
    setVideoTags(prev => prev.filter(t => t.id !== tagId))
    await removeTagFromVideo(videoId, tagId)
  }

  // Show snips errors in toast
  useEffect(() => {
    if (snipsError) {
      showError(snipsError, () => clearSnipsError())
    }
  }, [snipsError])

  // Staleness threshold: 3 minutes
  const STALE_THRESHOLD_MS = 3 * 60 * 1000

  const isSummaryStale = (data) => {
    // No summary row exists at all — treat as stale so we show retry
    if (!data) return true
    if (!data.created_at) return false
    if (data.status !== 'pending' && data.status !== 'generating') return false
    return Date.now() - new Date(data.created_at).getTime() > STALE_THRESHOLD_MS
  }

  // Fetch summary with proper error handling
  const pollIntervalRef = useRef(null)

  const startSummaryPolling = useCallback(() => {
    // Clear any existing polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    if (!videoId) return

    let isMounted = true

    const fetchSummary = async () => {
      setSummaryLoading(true)
      setSummaryError(null)
      try {
        const data = await getSummary(videoId)
        console.log('[Summary] Fetched:', { status: data?.status, created_at: data?.created_at, age_ms: data?.created_at ? Date.now() - new Date(data.created_at).getTime() : null })
        if (isMounted) {
          if (isSummaryStale(data)) {
            console.log('[Summary] Detected stale summary, showing retry', { data })
            setSummary(data)
            setSummaryError(data ? 'Summary generation timed out. Click retry to try again.' : 'Summary was not generated. Click retry to try again.')
            setSummaryLoading(false)
            // Stop polling since we already know it's stale
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            return
          }
          setSummary(data)
          // If already completed or failed, no need to poll
          if (data?.status === 'completed' || data?.status === 'failed') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            if (data?.status === 'failed') {
              setSummaryError('Failed to generate summary')
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch summary:', err)
        if (isMounted) {
          setSummaryError(err.message || 'Failed to load summary')
        }
      } finally {
        if (isMounted) {
          setSummaryLoading(false)
        }
      }
    }

    fetchSummary()

    // Poll for summary if it's generating
    pollIntervalRef.current = setInterval(async () => {
      try {
        const data = await getSummary(videoId)
        console.log('[Summary] Poll:', { status: data?.status, created_at: data?.created_at, age_ms: data?.created_at ? Date.now() - new Date(data.created_at).getTime() : null })
        if (isMounted) {
          if (isSummaryStale(data)) {
            console.log('[Summary] Detected stale summary, showing retry', { data })
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
            setSummary(data)
            setSummaryError(data ? 'Summary generation timed out. Click retry to try again.' : 'Summary was not generated. Click retry to try again.')
            return
          }

          setSummary(data)
          if (data?.status === 'completed' || data?.status === 'failed') {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
            if (data?.status === 'failed') {
              setSummaryError('Failed to generate summary')
            }
          }
        }
      } catch {
        // Silently continue polling on error
      }
    }, 5000)

    return () => {
      isMounted = false
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [videoId])

  useEffect(() => {
    const cleanup = startSummaryPolling()
    return cleanup
  }, [startSummaryPolling])

  const handleRetrySummary = async () => {
    setSummary(null)
    setSummaryLoading(true)
    setSummaryError(null)
    try {
      await retrySummary()
      startSummaryPolling()
    } catch (err) {
      console.error('Failed to retry summary:', err)
      setSummaryError(err.message || 'Failed to retry summary generation')
      setSummaryLoading(false)
    }
  }

  // Auto-scroll transcript to current time
  useEffect(() => {
    if (!showTranscript || !transcriptRef.current || !video?.transcript) return

    const scrollTimeout = setTimeout(() => {
      const currentSegment = transcriptRef.current.querySelector('[data-current="true"]')
      if (currentSegment) {
        currentSegment.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 250) // Debounce scroll

    return () => clearTimeout(scrollTimeout)
  }, [currentTime, showTranscript, video?.transcript])

  const handleTimeUpdate = useCallback((time) => {
    setCurrentTime(time)
  }, [])

  const handlePlayerReady = useCallback((player) => {
    playerRef.current = player
    // Seek to saved progress if any
    if (video?.progress_seconds > 0) {
      player.seekTo(video.progress_seconds, true)
    }
    // Update video duration if not set
    const duration = player.getDuration()
    if (duration && (!video?.duration_seconds || video.duration_seconds === 0)) {
      updateVideo({
        duration_seconds: Math.floor(duration),
        duration_formatted: formatDuration(Math.floor(duration))
      })
    }
  }, [video?.progress_seconds, video?.duration_seconds, updateVideo])

  const handleSnip = async () => {
    if (!video || snipping) return

    setSnipping(true)
    try {
      const timestamp = playerRef.current?.getCurrentTime() || currentTime
      await createSnip(video, Math.floor(timestamp))
    } catch (err) {
      console.error('Failed to create snip:', err)
      showError(err.message || 'Failed to create snip', () => handleSnip())
    } finally {
      setSnipping(false)
    }
  }

  const handleSeekToTimestamp = (seconds) => {
    playerRef.current?.seekTo(seconds, true)
  }

  const handleRetryTranscript = async () => {
    if (retryingTranscript) return

    setRetryingTranscript(true)
    setTranscriptError(null)

    try {
      const result = await retryTranscript()
      if (result?.noCaptions) {
        setTranscriptError('No captions available for this video')
      }
    } catch (err) {
      console.error('Failed to retry transcript:', err)
      setTranscriptError(err.message || 'Failed to fetch transcript')
    } finally {
      setRetryingTranscript(false)
    }
  }

  // Filter transcript by search
  const filteredTranscript = video?.transcript?.filter(segment =>
    transcriptSearch
      ? segment.text.toLowerCase().includes(transcriptSearch.toLowerCase())
      : true
  ) || []

  // Check if a segment is the current one
  const isCurrentSegment = (segment, index) => {
    if (!video?.transcript) return false
    const nextSegment = video.transcript[index + 1]
    return segment.start <= currentTime && (!nextSegment || nextSegment.start > currentTime)
  }

  // Save progress periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (video && currentTime > 0) {
        updateVideo({ progress_seconds: Math.floor(currentTime) })
      }
    }, 30000) // Save every 30 seconds

    return () => clearInterval(interval)
  }, [video, currentTime, updateVideo])

  if (videoLoading || !video) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-green" />
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {ErrorToastComponent}

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto bg-bg-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Back Button - Hidden on mobile (using header) */}
          <button
            onClick={onBack}
            className="hidden lg:flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Library</span>
          </button>

          {/* Video Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
              <a
                href={video.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-text-muted font-medium hover:text-text-secondary"
              >
                youtube.com
              </a>
            </div>
            <h1 className="font-serif text-2xl font-semibold text-text-primary tracking-tighter leading-tight mb-2">
              {video.title || 'Untitled Video'}
            </h1>
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <span>{video.author || 'Unknown'}</span>
              <span className="text-text-muted">•</span>
              <span>{video.duration_formatted || '--:--'}</span>
            </div>
          </div>

          {/* Video Player */}
          <YouTubePlayer
            videoId={video.youtube_id}
            onTimeUpdate={handleTimeUpdate}
            onReady={handlePlayerReady}
            initialTime={video.progress_seconds || 0}
            className="shadow-medium mb-4"
          />

          {/* Generating Snip Notification */}
          {generatingSnipAt !== null && (
            <div className="mb-4 p-3 bg-accent-rose/10 border border-accent-rose/20 rounded-xl">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-accent-rose" />
                <span className="text-sm text-accent-rose font-medium">
                  Generating snip at {formatDuration(generatingSnipAt)}...
                </span>
              </div>
            </div>
          )}

          {/* SNIP Button */}
          <button
            onClick={handleSnip}
            disabled={snipping || !video.transcript || generatingSnipAt !== null}
            className="w-full py-4 bg-accent-rose text-white text-sm font-semibold rounded-xl hover:bg-accent-rose/90 transition-colors shadow-medium tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {snipping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Snip...
              </>
            ) : (
              'SNIP'
            )}
          </button>

          {!video.transcript && (
            <div className="mt-3 p-3 bg-bg-secondary rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">
                    {transcriptError || 'No transcript available'}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    Transcript is required for snips, chat, and summaries
                  </p>
                </div>
                <button
                  onClick={handleRetryTranscript}
                  disabled={retryingTranscript}
                  className="flex items-center gap-2 px-3 py-2 bg-accent-green text-white text-sm font-medium rounded-lg hover:bg-accent-green/90 transition-colors disabled:opacity-50"
                >
                  {retryingTranscript ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Snip Context Preview */}
          {video.transcript && video.transcript.length > 0 && (
            <div className="mt-4 p-4 bg-bg-secondary rounded-xl border border-border">
              <p className="text-xs text-text-secondary mb-2">Snip context preview:</p>
              <div className="text-sm text-text-primary max-h-32 overflow-y-auto">
                {video.transcript
                  .filter(segment =>
                    segment.start >= currentTime - 30 &&
                    segment.start <= currentTime + 30
                  )
                  .map((segment, i) => {
                    const isCurrent = segment.start <= currentTime &&
                      (video.transcript.find(s => s.start > segment.start)?.start > currentTime ||
                       segment === video.transcript[video.transcript.length - 1])
                    return (
                      <span
                        key={i}
                        className={isCurrent ? 'bg-accent-rose/20 text-accent-rose font-medium' : 'text-text-secondary'}
                      >
                        {segment.text}{' '}
                      </span>
                    )
                  })}
                {video.transcript.filter(segment =>
                  segment.start >= currentTime - 30 &&
                  segment.start <= currentTime + 30
                ).length === 0 && (
                  <span className="text-text-muted italic">No transcript in this time range</span>
                )}
              </div>
            </div>
          )}

          {/* Transcript Toggle */}
          {video.transcript && video.transcript.length > 0 && (
            <>
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <span>View transcript</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showTranscript ? 'rotate-180' : ''}`} />
              </button>

              {/* Transcript Panel */}
              {showTranscript && (
                <div className="mt-2 bg-bg-secondary rounded-xl border border-border overflow-hidden">
                  {/* Transcript Search */}
                  <div className="p-3 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="text"
                        value={transcriptSearch}
                        onChange={(e) => setTranscriptSearch(e.target.value)}
                        placeholder="Search transcript..."
                        className="w-full pl-9 pr-4 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green"
                      />
                    </div>
                  </div>

                  <div ref={transcriptRef} className="p-4 max-h-96 overflow-y-auto">
                    <div className="space-y-3 text-sm text-text-secondary">
                      {filteredTranscript.map((segment, i) => {
                        const originalIndex = video.transcript.indexOf(segment)
                        const isCurrent = isCurrentSegment(segment, originalIndex)
                        return (
                          <p
                            key={i}
                            data-current={isCurrent}
                            className={`pl-3 border-l-2 transition-colors ${
                              isCurrent
                                ? 'border-accent-green bg-accent-green/5'
                                : 'border-transparent hover:border-border'
                            }`}
                          >
                            <button
                              onClick={() => handleSeekToTimestamp(segment.start)}
                              className="text-accent-rose font-medium mr-2 hover:underline"
                            >
                              {formatDuration(segment.start)}
                            </button>
                            {segment.text}
                          </p>
                        )
                      })}
                      {filteredTranscript.length === 0 && transcriptSearch && (
                        <p className="text-text-muted text-center py-4">No matches found</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
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
                <SnipsContent
                  snips={snips}
                  video={video}
                  onSeek={handleSeekToTimestamp}
                  onToggleStar={toggleStar}
                  onDelete={deleteSnip}
                  onRewrite={rewriteSnip}
                  onExpand={expandSnip}
                  availableTags={availableTags}
                  onAddTagToSnip={addTagToSnip}
                  onRemoveTagFromSnip={removeTagFromSnip}
                  onCreateTag={createTag}
                />
              </div>
            )}
          </div>

          {/* Mobile Summary Panel */}
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
                <SummaryContent summary={summary} loading={summaryLoading} error={summaryError} onRetry={handleRetrySummary} />
              </div>
            )}
          </div>
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
          {activeTab === 'snips' && (
            <SnipsTab
              snips={snips}
              video={video}
              loading={snipsLoading}
              onSeek={handleSeekToTimestamp}
              onToggleStar={toggleStar}
              onDelete={deleteSnip}
              onRewrite={rewriteSnip}
              onExpand={expandSnip}
              availableTags={availableTags}
              onAddTagToSnip={addTagToSnip}
              onRemoveTagFromSnip={removeTagFromSnip}
              onCreateTag={createTag}
            />
          )}
          {activeTab === 'summary' && (
            <SummaryTab summary={summary} loading={summaryLoading} error={summaryError} onRetry={handleRetrySummary} />
          )}
          {activeTab === 'info' && (
            <InfoTab
              video={video}
              videoTags={videoTags}
              availableTags={availableTags}
              onAddTag={handleAddTagToVideo}
              onRemoveTag={handleRemoveTagFromVideo}
              onCreateTag={createTag}
            />
          )}
          {activeTab === 'chat' && (
            <ChatTab
              video={video}
              snips={snips}
              messages={messages}
              sending={sending}
              error={chatError}
              lastFailedMessage={lastFailedMessage}
              onSendMessage={sendMessage}
              onRetry={retryLastMessage}
              onClearHistory={clearHistory}
              onClearError={clearChatError}
            />
          )}
        </div>
      </aside>
    </div>
  )
}

function SnipsContent({ snips, video, onSeek, onToggleStar, onDelete, onRewrite, onExpand, availableTags, onAddTagToSnip, onRemoveTagFromSnip, onCreateTag }) {
  return (
    <div className="space-y-4">
      {snips.map((snip, index) => (
        <SnipCard
          key={snip.id}
          snip={snip}
          video={video}
          isLast={index === snips.length - 1}
          onSeek={onSeek}
          onToggleStar={onToggleStar}
          onDelete={onDelete}
          onRewrite={onRewrite}
          onExpand={onExpand}
          availableTags={availableTags}
          onAddTagToSnip={onAddTagToSnip}
          onRemoveTagFromSnip={onRemoveTagFromSnip}
          onCreateTag={onCreateTag}
        />
      ))}
      {snips.length === 0 && (
        <p className="text-sm text-text-muted text-center py-4">No snips yet</p>
      )}
    </div>
  )
}

function SnipsTab({ snips, video, loading, onSeek, onToggleStar, onDelete, onRewrite, onExpand, availableTags, onAddTagToSnip, onRemoveTagFromSnip, onCreateTag }) {
  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent-green" />
      </div>
    )
  }

  return (
    <div className="p-4">
      {snips.map((snip, index) => (
        <SnipCard
          key={snip.id}
          snip={snip}
          video={video}
          isLast={index === snips.length - 1}
          onSeek={onSeek}
          onToggleStar={onToggleStar}
          onDelete={onDelete}
          onRewrite={onRewrite}
          onExpand={onExpand}
          availableTags={availableTags}
          onAddTagToSnip={onAddTagToSnip}
          onRemoveTagFromSnip={onRemoveTagFromSnip}
          onCreateTag={onCreateTag}
        />
      ))}
      {snips.length === 0 && (
        <p className="text-sm text-text-muted text-center py-8">No snips yet. Click SNIP while watching to create one.</p>
      )}
    </div>
  )
}

function SummaryContent({ summary, loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-accent-green" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-500 mb-2">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 text-xs text-accent-green hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    )
  }

  if (!summary || summary.status === 'pending' || summary.status === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-accent-green mb-3" />
        <p className="text-sm text-text-secondary">Generating summary...</p>
      </div>
    )
  }

  if (summary.status === 'failed') {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-500">Failed to generate summary</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 text-xs text-accent-green hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Point / Overview */}
      {summary.main_point && (
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Main Point</h4>
          <p className="text-sm text-text-primary leading-relaxed font-medium">
            {summary.main_point}
          </p>
        </div>
      )}

      {/* Key Takeaways */}
      {summary.key_takeaways && summary.key_takeaways.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Key Takeaways</h4>
          <ul className="space-y-3">
            {summary.key_takeaways.map((takeaway, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-text-secondary leading-relaxed">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-green/10 text-accent-green text-xs font-semibold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function SummaryTab({ summary, loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent-green" />
      </div>
    )
  }

  if (!summary && !error) {
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

      <SummaryContent summary={summary} loading={loading} error={error} onRetry={onRetry} />
    </div>
  )
}

function SnipCard({ snip, video, isLast, onSeek, onToggleStar, onDelete, onRewrite, onExpand, playerRef, availableTags, onAddTagToSnip, onRemoveTagFromSnip, onCreateTag }) {
  const [expanded, setExpanded] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [snipTags, setSnipTags] = useState(snip.tags || [])
  const [showTagDropdown, setShowTagDropdown] = useState(false)

  // Sync tags when snip updates
  useEffect(() => {
    setSnipTags(snip.tags || [])
  }, [snip.tags])

  const handleAddTagToSnip = async (tagId) => {
    const tag = availableTags?.find(t => t.id === tagId)
    if (tag) {
      setSnipTags(prev => [...prev, tag])
      await onAddTagToSnip?.(snip.id, tagId)
    }
  }

  const handleRemoveTagFromSnip = async (tagId) => {
    setSnipTags(prev => prev.filter(t => t.id !== tagId))
    await onRemoveTagFromSnip?.(snip.id, tagId)
  }

  // Calculate context window (30s before, 15s after)
  const startTime = Math.max(0, snip.timestamp_seconds - 30)
  const endTime = snip.timestamp_seconds + 15

  const handleSeek = () => {
    onSeek?.(snip.timestamp_seconds)
  }

  const handlePlaySegment = () => {
    onSeek?.(startTime)
  }

  const handleToggleStar = async (e) => {
    e.stopPropagation()
    await onToggleStar?.(snip.id)
  }

  const handleDelete = async () => {
    if (confirm('Delete this snip?')) {
      await onDelete?.(snip.id)
    }
  }

  const handleRewrite = async () => {
    setEnhancing(true)
    try {
      await onRewrite?.(snip.id, 'actionable', video)
    } catch (err) {
      console.error('[Snip] Rewrite failed:', err)
    } finally {
      setEnhancing(false)
    }
  }

  const handleExpandSummary = async () => {
    setEnhancing(true)
    try {
      await onExpand?.(snip.id, video)
    } catch (err) {
      console.error('[Snip] Expand failed:', err)
    } finally {
      setEnhancing(false)
    }
  }

  // Get transcript context for this snip
  const getTranscriptContext = () => {
    if (!video?.transcript) return null
    return video.transcript
      .filter(segment => segment.start >= startTime && segment.start <= endTime)
      .map(segment => segment.text)
      .join(' ')
  }

  const transcriptContext = getTranscriptContext()

  return (
    <div className={`pb-4 ${!isLast ? 'mb-4 border-b border-border' : ''}`}>
      {/* Clickable Header */}
      <div
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-base font-semibold text-text-primary tracking-tight leading-snug">
              {snip.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleSeek(); }}
                className="text-xs font-medium text-accent-rose hover:underline"
              >
                {snip.timestamp_formatted}
              </button>
              {snip.ai_generated && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-bg-secondary rounded text-[10px] font-medium text-text-muted">
                  <Sparkles className="w-2.5 h-2.5" />
                  By AI
                </span>
              )}
            </div>
            {snipTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {snipTags.map(tag => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                    style={{ backgroundColor: tag.color || '#6B7280' }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {enhancing && <Loader2 className="w-4 h-4 animate-spin text-accent-green" />}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowTagDropdown(!showTagDropdown); }}
                className={`p-1.5 rounded-lg hover:bg-bg-secondary transition-colors ${snipTags.length > 0 ? 'text-accent-green' : 'text-text-muted'}`}
              >
                <TagIcon className="w-4 h-4" />
              </button>
              {showTagDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => { e.stopPropagation(); setShowTagDropdown(false); }}
                  />
                  <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white rounded-lg shadow-lg border border-border overflow-hidden">
                    <div className="p-2 border-b border-border">
                      <p className="text-xs font-medium text-text-muted px-2">Add tags</p>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-2">
                      {availableTags?.map(tag => {
                        const isSelected = snipTags.some(t => t.id === tag.id)
                        return (
                          <button
                            key={tag.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (isSelected) {
                                handleRemoveTagFromSnip(tag.id)
                              } else {
                                handleAddTagToSnip(tag.id)
                              }
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-bg-secondary transition-colors text-left"
                          >
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: tag.color || '#6B7280' }}
                            />
                            <span className="text-sm text-text-primary truncate flex-1">{tag.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-accent-green" />}
                          </button>
                        )
                      })}
                      {(!availableTags || availableTags.length === 0) && (
                        <p className="text-sm text-text-muted text-center py-2">No tags yet</p>
                      )}
                    </div>
                    <div className="border-t border-border p-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowTagDropdown(false)
                          setExpanded(true)
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-bg-secondary transition-colors text-left"
                      >
                        <Plus className="w-4 h-4 text-accent-green" />
                        <span className="text-sm text-accent-green font-medium">Create new tag</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleStar(e); }}
              className={`p-1.5 rounded-lg hover:bg-bg-secondary transition-colors ${snip.starred ? 'text-amber-400' : 'text-text-muted'}`}
            >
              <Star className={`w-4 h-4 ${snip.starred ? 'fill-current' : ''}`} />
            </button>
            <button
              className="p-1.5 rounded-lg hover:bg-bg-secondary transition-colors text-text-muted"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bullets - Always visible */}
        {snip.bullets && snip.bullets.length > 0 && (
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

      {/* Expanded Content */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          expanded ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}
      >
        {/* Timestamp Range with Playback */}
        <div className="flex items-center justify-between gap-2 p-3 bg-bg-secondary rounded-lg mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlaySegment}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-rose text-white hover:bg-accent-rose/90 transition-colors"
            >
              <Play className="w-4 h-4 ml-0.5" />
            </button>
            <div>
              <p className="text-sm font-medium text-text-primary">
                {formatDuration(startTime)} - {formatDuration(endTime)}
              </p>
              <p className="text-xs text-text-muted">Segment duration</p>
            </div>
          </div>
          <button className="text-xs text-accent-green hover:underline">
            Edit range
          </button>
        </div>

        {/* Quote Block */}
        {snip.quote && (
          <div className="relative p-4 bg-rose-50 border-l-[3px] border-accent-rose rounded-r-lg mb-3">
            <button className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-rose-100 transition-colors text-text-muted">
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-start gap-2 pr-8">
              <Quote className="w-4 h-4 text-accent-rose flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[15px] text-text-primary italic leading-relaxed">
                  "{snip.quote}"
                </p>
                {snip.speaker && (
                  <p className="text-sm text-text-muted mt-2">— {snip.speaker}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View Transcript Section */}
        {transcriptContext && (
          <div className="mb-3">
            <button
              onClick={(e) => { e.stopPropagation(); setShowTranscript(!showTranscript); }}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showTranscript ? 'rotate-180' : ''}`} />
              <span>View transcript</span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ease-in-out ${
                showTranscript ? 'max-h-48 opacity-100 mt-2' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="p-4 bg-[#F9FAFB] rounded-lg max-h-40 overflow-y-auto">
                <p className="text-sm text-text-secondary leading-relaxed">
                  {transcriptContext}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Expanded Summary */}
        {snip.expanded_summary && (
          <div className="p-3 bg-accent-green/5 border border-accent-green/20 rounded-lg mb-3">
            <p className="text-sm text-text-secondary leading-relaxed">{snip.expanded_summary}</p>
          </div>
        )}

        {/* Tags */}
        <div className="mb-3">
          <p className="text-xs font-medium text-text-muted mb-2">Tags</p>
          <TagPicker
            selectedTags={snipTags}
            availableTags={availableTags || []}
            onAddTag={handleAddTagToSnip}
            onRemoveTag={handleRemoveTagFromSnip}
            onCreateTag={onCreateTag}
          />
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={handleRewrite}
            disabled={enhancing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-secondary transition-colors disabled:opacity-50"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Rewrite
          </button>
          <button
            onClick={handlePlaySegment}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-secondary transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Play segment
          </button>
          <button
            onClick={handleExpandSummary}
            disabled={enhancing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-secondary transition-colors disabled:opacity-50"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Expand
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoTab({ video, videoTags, availableTags, onAddTag, onRemoveTag, onCreateTag }) {
  return (
    <div className="p-4">
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Channel</h4>
          <p className="text-sm text-text-primary">{video.author || 'Unknown'}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Duration</h4>
          <p className="text-sm text-text-secondary">{video.duration_formatted || '--:--'}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Status</h4>
          <p className="text-sm text-text-secondary capitalize">{video.status?.replace('_', ' ') || 'In progress'}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Added</h4>
          <p className="text-sm text-text-secondary">
            {video.created_at ? new Date(video.created_at).toLocaleDateString() : 'Unknown'}
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Tags</h4>
          <TagPicker
            selectedTags={videoTags}
            availableTags={availableTags}
            onAddTag={onAddTag}
            onRemoveTag={onRemoveTag}
            onCreateTag={onCreateTag}
          />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">YouTube Link</h4>
          <a
            href={video.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent-green hover:underline break-all"
          >
            {video.youtube_url}
          </a>
        </div>
      </div>
    </div>
  )
}

function ChatTab({ video, snips, messages, sending, error, lastFailedMessage, onSendMessage, onRetry, onClearHistory, onClearError }) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || sending) return

    const message = input.trim()
    setInput('')

    try {
      await onSendMessage(message, video.transcript_raw, video.title, snips)
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleRetry = async () => {
    onClearError?.()
    try {
      await onRetry?.()
    } catch (err) {
      console.error('Retry failed:', err)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5 text-text-muted" />
              </div>
              <p className="text-sm text-text-secondary mb-1">Ask questions about this video</p>
              <p className="text-xs text-text-muted">AI will use the transcript to answer</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                    message.role === 'user'
                      ? 'bg-accent-green text-white rounded-br-md'
                      : 'bg-bg-secondary text-text-primary rounded-bl-md'
                  }`}
                >
                  {message.content.split('\n').map((paragraph, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-bg-secondary px-4 py-2.5 rounded-2xl rounded-bl-md">
                  <Loader2 className="w-4 h-4 animate-spin text-accent-green" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
            {lastFailedMessage && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Clear History Button */}
      {messages.length > 0 && !error && (
        <div className="px-4 pb-2">
          <button
            onClick={onClearHistory}
            className="text-xs text-text-muted hover:text-red-500 transition-colors"
          >
            Clear chat history
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={video.transcript_raw ? 'Ask a question...' : 'No transcript available'}
            disabled={!video.transcript_raw || sending}
            className="w-full px-4 py-3 pr-12 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || !video.transcript_raw}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-accent-green hover:bg-accent-green/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default VideoDetailView
