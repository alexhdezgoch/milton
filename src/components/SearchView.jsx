import { useState, useMemo } from 'react'
import { Search, Play, Clock, Sparkles, X } from 'lucide-react'

function SearchView({ videos, snips, onSelectVideo }) {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const results = useMemo(() => {
    if (!query.trim()) return { videos: [], snips: [] }

    const q = query.toLowerCase()

    const matchedVideos = videos.filter(
      v => v.title.toLowerCase().includes(q) ||
           v.author.toLowerCase().includes(q) ||
           v.tags.some(t => t.toLowerCase().includes(q))
    )

    const matchedSnips = snips.filter(
      s => s.title.toLowerCase().includes(q) ||
           s.bullets.some(b => b.toLowerCase().includes(q))
    )

    return { videos: matchedVideos, snips: matchedSnips }
  }, [query, videos, snips])

  const totalResults = results.videos.length + results.snips.length

  const recentSearches = ['UX design', 'cognitive load', 'whitespace', 'Tiago Forte']

  return (
    <main className="flex-1 h-screen overflow-y-auto bg-bg-primary">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-semibold text-text-primary tracking-tighter mb-2">
            Search
          </h1>
          <p className="text-text-secondary">Find videos and snips across your library</p>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos, snips, tags..."
            className="w-full pl-12 pr-12 py-4 bg-bg-secondary border border-border rounded-2xl text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green transition-all"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-border rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          )}
        </div>

        {/* Results */}
        {query.trim() ? (
          <>
            {/* Filter Tabs */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm text-text-muted">
                {totalResults} result{totalResults !== 1 ? 's' : ''}
              </span>
              <div className="flex bg-bg-secondary rounded-lg p-1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'videos', label: `Videos (${results.videos.length})` },
                  { id: 'snips', label: `Snips (${results.snips.length})` },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      activeFilter === filter.id
                        ? 'bg-bg-primary text-text-primary shadow-subtle'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Results */}
            {(activeFilter === 'all' || activeFilter === 'videos') && results.videos.length > 0 && (
              <div className="mb-8">
                {activeFilter === 'all' && (
                  <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
                    Videos
                  </h2>
                )}
                <div className="space-y-3">
                  {results.videos.map((video) => (
                    <VideoResult
                      key={video.id}
                      video={video}
                      query={query}
                      onClick={() => onSelectVideo(video.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Snip Results */}
            {(activeFilter === 'all' || activeFilter === 'snips') && results.snips.length > 0 && (
              <div>
                {activeFilter === 'all' && (
                  <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
                    Snips
                  </h2>
                )}
                <div className="space-y-3">
                  {results.snips.map((snip) => (
                    <SnipResult
                      key={snip.id}
                      snip={snip}
                      video={videos.find(v => v.id === snip.videoId)}
                      query={query}
                      onClick={() => onSelectVideo(snip.videoId)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {totalResults === 0 && (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">No results found</h3>
                <p className="text-text-secondary">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}
          </>
        ) : (
          /* Empty State - Recent Searches */
          <div>
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
              Recent Searches
            </h2>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => setQuery(search)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-bg-secondary hover:bg-border rounded-lg transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-text-muted" />
                  <span className="text-sm text-text-primary">{search}</span>
                </button>
              ))}
            </div>

            {/* Search Tips */}
            <div className="mt-12 p-6 bg-bg-secondary rounded-2xl">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Search Tips</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-text-muted">•</span>
                  Search by video title, author name, or tags
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-text-muted">•</span>
                  Find snips by their content or key points
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-text-muted">•</span>
                  Use specific keywords for better results
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function VideoResult({ video, query, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group flex gap-4 p-4 bg-bg-secondary rounded-xl hover:bg-border transition-colors cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="w-36 flex-shrink-0 aspect-video bg-video-dark rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div
            className="h-full bg-accent-rose"
            style={{ width: `${video.progress}%` }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-serif text-base font-semibold text-text-primary tracking-tight leading-snug line-clamp-2 mb-1">
          <HighlightText text={video.title} query={query} />
        </h3>
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
          <HighlightText text={video.author} query={query} />
          <span className="text-text-muted">•</span>
          <span>{video.duration}</span>
        </div>
        <div className="flex items-center gap-2">
          {video.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-bg-primary rounded text-xs font-medium text-text-secondary"
            >
              <HighlightText text={tag} query={query} />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function SnipResult({ snip, video, query, onClick }) {
  return (
    <div
      onClick={onClick}
      className="p-4 bg-bg-secondary rounded-xl hover:bg-border transition-colors cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-serif text-base font-semibold text-text-primary tracking-tight leading-snug">
          <HighlightText text={snip.title} query={query} />
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-accent-rose">{snip.timestamp}</span>
          {snip.aiGenerated && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-bg-primary rounded text-[10px] font-medium text-text-muted">
              <Sparkles className="w-2.5 h-2.5" />
              AI
            </span>
          )}
        </div>
      </div>

      {/* Matching Bullet */}
      {snip.bullets.some(b => b.toLowerCase().includes(query.toLowerCase())) && (
        <div className="mb-3">
          {snip.bullets
            .filter(b => b.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 2)
            .map((bullet, i) => (
              <p key={i} className="flex items-start gap-2.5 text-sm text-text-secondary leading-relaxed">
                <span className="mt-2 w-1 h-1 rounded-full bg-text-muted flex-shrink-0" />
                <HighlightText text={bullet} query={query} />
              </p>
            ))}
        </div>
      )}

      {/* Video Info */}
      {video && (
        <div className="flex items-center gap-2 text-xs text-text-muted pt-2 border-t border-border">
          <span>From:</span>
          <span className="text-text-secondary">{video.title}</span>
        </div>
      )}
    </div>
  )
}

function HighlightText({ text, query }) {
  if (!query.trim()) return text

  const parts = text.split(new RegExp(`(${query})`, 'gi'))

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-amber-200/50 text-inherit rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

export default SearchView
