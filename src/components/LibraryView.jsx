import { useState } from 'react'
import { Play, Clock, CheckCircle2, SortAsc, Grid3X3, List, MoreHorizontal, Plus } from 'lucide-react'

function LibraryView({ videos, onSelectVideo }) {
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('recent')
  const [filterStatus, setFilterStatus] = useState('all')
  const [url, setUrl] = useState('')

  const filteredVideos = videos.filter(v => {
    if (filterStatus === 'all') return true
    return v.status === filterStatus
  })

  const sortedVideos = [...filteredVideos].sort((a, b) => {
    if (sortBy === 'recent') return new Date(b.addedAt) - new Date(a.addedAt)
    if (sortBy === 'title') return a.title.localeCompare(b.title)
    if (sortBy === 'progress') return b.progress - a.progress
    return 0
  })

  const stats = {
    total: videos.length,
    inProgress: videos.filter(v => v.status === 'in_progress').length,
    completed: videos.filter(v => v.status === 'completed').length,
    totalSnips: videos.reduce((acc, v) => acc + v.snipsCount, 0),
  }

  return (
    <main className="flex-1 h-screen overflow-y-auto bg-bg-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-semibold text-text-primary tracking-tighter mb-2">
            Library
          </h1>
          <p className="text-text-secondary">All your saved videos in one place</p>
        </div>

        {/* Add Video Input */}
        <div className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a YouTube URL to add a new video..."
              className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green transition-all"
            />
          </div>
          <button className="px-5 py-3 bg-accent-green text-white text-sm font-medium rounded-xl hover:bg-accent-green/90 transition-colors shadow-subtle flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Video
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Videos" value={stats.total} />
          <StatCard label="In Progress" value={stats.inProgress} icon={Clock} iconColor="text-amber-500" />
          <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} iconColor="text-accent-green" />
          <StatCard label="Total Snips" value={stats.totalSnips} />
        </div>

        {/* Filters & View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Status Filter */}
          <div className="flex bg-bg-secondary rounded-lg p-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'completed', label: 'Completed' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFilterStatus(filter.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  filterStatus === filter.id
                    ? 'bg-bg-primary text-text-primary shadow-subtle'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Sort & View */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-text-muted" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm text-text-secondary focus:outline-none cursor-pointer"
              >
                <option value="recent">Recently Added</option>
                <option value="title">Title</option>
                <option value="progress">Progress</option>
              </select>
            </div>
            <div className="flex bg-bg-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid' ? 'bg-bg-primary shadow-subtle' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list' ? 'bg-bg-primary shadow-subtle' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Video Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedVideos.map((video) => (
              <VideoCard key={video.id} video={video} onClick={() => onSelectVideo(video.id)} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedVideos.map((video) => (
              <VideoListItem key={video.id} video={video} onClick={() => onSelectVideo(video.id)} />
            ))}
          </div>
        )}

        {sortedVideos.length === 0 && (
          <div className="text-center py-16">
            <p className="text-text-muted">No videos found</p>
          </div>
        )}
      </div>
    </main>
  )
}

function StatCard({ label, value, icon: Icon, iconColor }) {
  return (
    <div className="bg-bg-secondary rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
      </div>
      <span className="text-2xl font-semibold text-text-primary">{value}</span>
    </div>
  )
}

function VideoCard({ video, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group bg-bg-primary border border-border rounded-xl overflow-hidden hover:shadow-medium transition-all cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-video-dark relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div
            className="h-full bg-accent-rose"
            style={{ width: `${video.progress}%` }}
          />
        </div>
        {/* Status badge */}
        {video.status === 'completed' && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-accent-green/90 rounded-md text-xs font-medium text-white">
            Completed
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-serif text-base font-semibold text-text-primary tracking-tight leading-snug line-clamp-2 mb-2">
          {video.title}
        </h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">{video.author}</span>
          <span className="text-text-muted">{video.duration}</span>
        </div>
        <div className="flex items-center gap-2 mt-3">
          {video.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-bg-secondary rounded text-xs font-medium text-text-secondary"
            >
              {tag}
            </span>
          ))}
          {video.tags.length > 2 && (
            <span className="text-xs text-text-muted">+{video.tags.length - 2}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function VideoListItem({ video, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group flex gap-4 p-4 bg-bg-primary border border-border rounded-xl hover:shadow-medium transition-all cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="w-40 flex-shrink-0 aspect-video bg-video-dark rounded-lg relative overflow-hidden">
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
        <h3 className="font-serif text-base font-semibold text-text-primary tracking-tight leading-snug line-clamp-1 mb-1">
          {video.title}
        </h3>
        <div className="flex items-center gap-3 text-sm text-text-secondary mb-2">
          <span>{video.author}</span>
          <span className="text-text-muted">•</span>
          <span>{video.duration}</span>
          <span className="text-text-muted">•</span>
          <span>{video.snipsCount} snips</span>
        </div>
        <div className="flex items-center gap-2">
          {video.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-bg-secondary rounded text-xs font-medium text-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center">
        <button className="p-2 hover:bg-bg-secondary rounded-lg transition-colors opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-5 h-5 text-text-muted" />
        </button>
      </div>
    </div>
  )
}

export default LibraryView
