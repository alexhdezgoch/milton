import { useState, useEffect } from 'react'
import { Plus, Tag as TagIcon, X, Play, Loader2, Trash2, Clock, Sparkles } from 'lucide-react'
import { useTags } from '../hooks/useTags'

function TagsView({ onSelectVideo }) {
  const [selectedTag, setSelectedTag] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [taggedVideos, setTaggedVideos] = useState([])
  const [taggedSnips, setTaggedSnips] = useState([])
  const [loadingContent, setLoadingContent] = useState(false)
  const [contentError, setContentError] = useState(null)
  const [activeContentTab, setActiveContentTab] = useState('videos')

  const { tags, loading, createTag, deleteTag, getVideosForTag, getSnipsForTag } = useTags()

  // Fetch videos and snips when tag is selected
  useEffect(() => {
    if (!selectedTag) {
      setTaggedVideos([])
      setTaggedSnips([])
      setContentError(null)
      return
    }

    const fetchContent = async () => {
      setLoadingContent(true)
      setContentError(null)
      try {
        const [videos, snips] = await Promise.all([
          getVideosForTag(selectedTag.id),
          getSnipsForTag(selectedTag.id)
        ])
        setTaggedVideos(videos || [])
        setTaggedSnips(snips || [])
      } catch (err) {
        console.error('Failed to fetch tagged content:', err)
        setContentError(err.message || 'Failed to load content')
      } finally {
        setLoadingContent(false)
      }
    }

    fetchContent()
  }, [selectedTag?.id]) // Only depend on tag ID, not the functions

  const handleCreateTag = async (name, color) => {
    try {
      await createTag(name, color)
      setShowCreateModal(false)
    } catch (err) {
      console.error('Failed to create tag:', err)
      alert(err.message || 'Failed to create tag')
    }
  }

  const handleDeleteTag = async () => {
    if (!selectedTag) return
    if (!confirm(`Delete tag "${selectedTag.name}"?`)) return

    try {
      await deleteTag(selectedTag.id)
      setSelectedTag(null)
    } catch (err) {
      console.error('Failed to delete tag:', err)
    }
  }

  if (loading) {
    return (
      <main className="flex-1 h-full overflow-y-auto bg-bg-primary">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-accent-green" />
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 h-full overflow-y-auto bg-bg-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-text-primary tracking-tighter mb-2">
              Tags
            </h1>
            <p className="text-text-secondary">Organize your videos and snips with tags</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent-green text-white text-sm font-medium rounded-xl hover:bg-accent-green/90 transition-colors shadow-subtle"
          >
            <Plus className="w-4 h-4" />
            New Tag
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tags List */}
          <div className="lg:col-span-1">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
              All Tags ({tags.length})
            </h2>
            <div className="space-y-2">
              {tags.map((tag) => (
                <TagItem
                  key={tag.id}
                  tag={tag}
                  isSelected={selectedTag?.id === tag.id}
                  onClick={() => setSelectedTag(selectedTag?.id === tag.id ? null : tag)}
                />
              ))}
            </div>

            {tags.length === 0 && (
              <div className="text-center py-12 bg-bg-secondary rounded-xl">
                <TagIcon className="w-8 h-8 text-text-muted mx-auto mb-3" />
                <p className="text-sm text-text-muted">No tags yet</p>
                <p className="text-xs text-text-muted mt-1">Create your first tag to get started</p>
              </div>
            )}
          </div>

          {/* Tagged Content */}
          <div className="lg:col-span-2">
            {selectedTag ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedTag.color }}
                    />
                    <h2 className="text-lg font-semibold text-text-primary">{selectedTag.name}</h2>
                  </div>
                  <button
                    onClick={handleDeleteTag}
                    className="text-sm text-text-secondary hover:text-accent-rose transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete tag
                  </button>
                </div>

                {/* Content Tabs */}
                <div className="flex gap-1 p-1 bg-bg-secondary rounded-lg mb-4">
                  <button
                    onClick={() => setActiveContentTab('videos')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeContentTab === 'videos'
                        ? 'bg-white text-text-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Videos ({taggedVideos.length})
                  </button>
                  <button
                    onClick={() => setActiveContentTab('snips')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeContentTab === 'snips'
                        ? 'bg-white text-text-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Snips ({taggedSnips.length})
                  </button>
                </div>

                {contentError ? (
                  <div className="text-center py-16 bg-red-50 rounded-xl border border-red-200">
                    <p className="text-red-600 font-medium">Error loading content</p>
                    <p className="text-red-500 text-sm mt-1">{contentError}</p>
                  </div>
                ) : loadingContent ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-accent-green" />
                  </div>
                ) : activeContentTab === 'videos' ? (
                  taggedVideos.length > 0 ? (
                    <div className="space-y-3">
                      {taggedVideos.map((video) => (
                        <TaggedVideoItem key={video.id} video={video} onClick={() => onSelectVideo(video.id)} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-bg-secondary rounded-xl">
                      <p className="text-text-muted">No videos with this tag</p>
                    </div>
                  )
                ) : (
                  taggedSnips.length > 0 ? (
                    <div className="space-y-3">
                      {taggedSnips.map((snip) => (
                        <TaggedSnipItem key={snip.id} snip={snip} onClick={() => onSelectVideo(snip.video_id)} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-bg-secondary rounded-xl">
                      <p className="text-text-muted">No snips with this tag</p>
                    </div>
                  )
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64 bg-bg-secondary rounded-xl">
                <div className="text-center">
                  <TagIcon className="w-10 h-10 text-text-muted mx-auto mb-3" />
                  <p className="text-text-secondary mb-1">Select a tag to view content</p>
                  <p className="text-sm text-text-muted">Click on any tag from the list</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Popular Tags Cloud */}
        {tags.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
              Quick Access
            </h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTag(tag)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-bg-secondary hover:bg-border rounded-lg transition-colors"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm font-medium text-text-primary">{tag.name}</span>
                  <span className="text-xs text-text-muted">{tag.count || 0}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Tag Modal */}
      {showCreateModal && (
        <CreateTagModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTag}
        />
      )}
    </main>
  )
}

function TagItem({ tag, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
        isSelected
          ? 'bg-accent-green/5 border border-accent-green/20'
          : 'bg-bg-secondary hover:bg-border border border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: tag.color }}
        />
        <span className={`text-sm font-medium ${isSelected ? 'text-accent-green' : 'text-text-primary'}`}>
          {tag.name}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {tag.videoCount > 0 && (
          <span className="text-[10px] text-text-muted bg-bg-primary px-1.5 py-0.5 rounded">
            {tag.videoCount}v
          </span>
        )}
        {tag.snipCount > 0 && (
          <span className="text-[10px] text-text-muted bg-bg-primary px-1.5 py-0.5 rounded">
            {tag.snipCount}s
          </span>
        )}
        {(tag.count || 0) === 0 && (
          <span className="text-[10px] text-text-muted bg-bg-primary px-1.5 py-0.5 rounded">
            0
          </span>
        )}
      </div>
    </div>
  )
}

function TaggedVideoItem({ video, onClick }) {
  const progress = video.duration_seconds > 0
    ? Math.round((video.progress_seconds / video.duration_seconds) * 100)
    : 0

  return (
    <div onClick={onClick} className="group flex gap-4 p-4 bg-bg-secondary rounded-xl hover:bg-border transition-colors cursor-pointer">
      {/* Thumbnail */}
      <div className="w-32 flex-shrink-0 aspect-video bg-video-dark rounded-lg relative overflow-hidden">
        {video.thumbnail_url && (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-3 h-3 text-white fill-white ml-0.5" />
          </div>
        </div>
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div
            className="h-full bg-accent-rose"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-serif text-sm font-semibold text-text-primary tracking-tight leading-snug line-clamp-2 mb-1">
          {video.title || 'Untitled Video'}
        </h3>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span>{video.author || 'Unknown'}</span>
          <span className="text-text-muted">•</span>
          <span>{video.snipsCount || 0} snips</span>
        </div>
      </div>
    </div>
  )
}

function TaggedSnipItem({ snip, onClick }) {
  return (
    <div onClick={onClick} className="group flex gap-4 p-4 bg-bg-secondary rounded-xl hover:bg-border transition-colors cursor-pointer">
      {/* Video Thumbnail */}
      <div className="w-24 flex-shrink-0 aspect-video bg-video-dark rounded-lg relative overflow-hidden">
        {snip.video?.thumbnail_url && (
          <img
            src={snip.video.thumbnail_url}
            alt={snip.video?.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
          <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-2.5 h-2.5 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-3 h-3 text-accent-rose" />
          <span className="text-xs font-medium text-accent-rose">{snip.timestamp_formatted}</span>
          {snip.ai_generated && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-bg-primary rounded text-[10px] font-medium text-text-muted">
              <Sparkles className="w-2.5 h-2.5" />
              AI
            </span>
          )}
        </div>
        <h3 className="font-serif text-sm font-semibold text-text-primary tracking-tight leading-snug line-clamp-2 mb-1">
          {snip.title}
        </h3>
        <p className="text-xs text-text-muted truncate">
          From: {snip.video?.title || 'Unknown video'}
        </p>
        {snip.bullets && snip.bullets.length > 0 && (
          <p className="text-xs text-text-secondary mt-1 line-clamp-1">
            {snip.bullets[0]}
          </p>
        )}
      </div>
    </div>
  )
}

function CreateTagModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#059669')
  const [creating, setCreating] = useState(false)

  const colors = [
    '#059669', '#0891B2', '#7C3AED', '#EA580C',
    '#DB2777', '#4F46E5', '#DC2626', '#CA8A04'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setCreating(true)
    try {
      await onCreate(name.trim(), color)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-primary rounded-2xl shadow-medium w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Create New Tag</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-5">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Tag Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Design, Tutorial, Inspiration"
                className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green transition-all"
              />
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Color
              </label>
              <div className="flex gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      color === c ? 'ring-2 ring-offset-2 ring-text-primary scale-110' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Preview
              </label>
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-lg">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-medium text-text-primary">
                  {name || 'Tag Name'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-5 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || creating}
              className="px-5 py-2.5 bg-accent-green text-white text-sm font-medium rounded-xl hover:bg-accent-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Tag
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TagsView
