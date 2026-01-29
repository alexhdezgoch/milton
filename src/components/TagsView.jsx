import { useState } from 'react'
import { Plus, Tag as TagIcon, X, Play } from 'lucide-react'

function TagsView({ tags, videos, onSelectVideo }) {
  const [selectedTag, setSelectedTag] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const taggedVideos = selectedTag
    ? videos.filter(v => v.tags.includes(selectedTag.name))
    : []

  return (
    <main className="flex-1 h-screen overflow-y-auto bg-bg-primary">
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

          {/* Tagged Videos */}
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
                    <span className="text-sm text-text-muted">
                      {taggedVideos.length} video{taggedVideos.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button className="text-sm text-text-secondary hover:text-accent-rose transition-colors">
                    Delete tag
                  </button>
                </div>

                {taggedVideos.length > 0 ? (
                  <div className="space-y-3">
                    {taggedVideos.map((video) => (
                      <TaggedVideoItem key={video.id} video={video} onClick={() => onSelectVideo(video.id)} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-bg-secondary rounded-xl">
                    <p className="text-text-muted">No videos with this tag</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64 bg-bg-secondary rounded-xl">
                <div className="text-center">
                  <TagIcon className="w-10 h-10 text-text-muted mx-auto mb-3" />
                  <p className="text-text-secondary mb-1">Select a tag to view videos</p>
                  <p className="text-sm text-text-muted">Click on any tag from the list</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Popular Tags Cloud */}
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
                <span className="text-xs text-text-muted">{tag.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Create Tag Modal */}
      {showCreateModal && (
        <CreateTagModal onClose={() => setShowCreateModal(false)} />
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
      <span className="text-xs text-text-muted bg-bg-primary px-2 py-0.5 rounded-full">
        {tag.count}
      </span>
    </div>
  )
}

function TaggedVideoItem({ video, onClick }) {
  return (
    <div onClick={onClick} className="group flex gap-4 p-4 bg-bg-secondary rounded-xl hover:bg-border transition-colors cursor-pointer">
      {/* Thumbnail */}
      <div className="w-32 flex-shrink-0 aspect-video bg-video-dark rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-3 h-3 text-white fill-white ml-0.5" />
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
        <h3 className="font-serif text-sm font-semibold text-text-primary tracking-tight leading-snug line-clamp-2 mb-1">
          {video.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span>{video.author}</span>
          <span className="text-text-muted">•</span>
          <span>{video.snipsCount} snips</span>
        </div>
      </div>
    </div>
  )
}

function CreateTagModal({ onClose }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#059669')

  const colors = [
    '#059669', '#0891B2', '#7C3AED', '#EA580C',
    '#DB2777', '#4F46E5', '#DC2626', '#CA8A04'
  ]

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
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button className="px-5 py-2.5 bg-accent-green text-white text-sm font-medium rounded-xl hover:bg-accent-green/90 transition-colors">
            Create Tag
          </button>
        </div>
      </div>
    </div>
  )
}

export default TagsView
