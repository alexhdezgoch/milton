import { ChevronDown, Play, MoreHorizontal, Archive } from 'lucide-react';
import type { Video } from '../types';

interface VideoListProps {
  videos: Video[];
  selectedVideoId: string | null;
  onVideoSelect: (videoId: string) => void;
  filter: 'in-progress' | 'completed';
}

export default function VideoList({ videos, selectedVideoId, onVideoSelect, filter }: VideoListProps) {
  const filteredVideos = videos.filter(v => v.status === filter);

  return (
    <div className="flex-1 flex flex-col min-w-[380px] border-r border-[var(--color-border)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-4">
          <button className="flex items-center gap-1.5 text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors">
            <span className="text-lg font-bold">Library</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <button className="hover:text-[var(--color-text-secondary)] transition-colors">Date moved</button>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-6 text-sm">
          {['Inbox', 'Later', 'Archive'].map((tab, i) => (
            <button
              key={tab}
              className={`pb-2 border-b-2 transition-colors text-sm
                ${i === 0
                  ? 'text-[var(--color-text)] border-[var(--color-accent)] font-medium'
                  : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text-secondary)]'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Video list */}
      <div className="flex-1 overflow-y-auto">
        {filteredVideos.length === 0 ? (
          <div className="text-center py-16 px-6">
            <p className="text-[var(--color-text-muted)] text-sm">No videos yet</p>
          </div>
        ) : (
          <div>
            {filteredVideos.map((video, index) => (
              <VideoRow
                key={video.id}
                video={video}
                isSelected={selectedVideoId === video.id}
                onClick={() => onVideoSelect(video.id)}
                showBorder={index < filteredVideos.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VideoRow({
  video,
  isSelected,
  onClick,
  showBorder
}: {
  video: Video;
  isSelected: boolean;
  onClick: () => void;
  showBorder: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`group px-6 py-4 cursor-pointer transition-colors
        ${isSelected ? 'bg-[var(--color-accent-subtle)]' : 'hover:bg-[var(--color-bg-subtle)]'}
        ${showBorder ? 'border-b border-[var(--color-border)]' : ''}`}
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="relative w-[120px] shrink-0">
          <div className="aspect-video rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
              </div>
            </div>
          </div>
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs font-medium">
            {video.duration}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 py-0.5">
          <h3 className="font-semibold text-base text-[var(--color-text)] line-clamp-2 leading-snug">
            {video.title}
          </h3>

          {/* Meta row */}
          <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--color-text-muted)]">
            <span>youtube.com</span>
            <span>•</span>
            <span>Brad Jacobs</span>
            <span>•</span>
            <span>{Math.round((100 - video.progress) / 100 * 83)} min left</span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-[3px] rounded-full bg-[var(--color-border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-accent)]"
              style={{ width: `${video.progress}%` }}
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end justify-between py-0.5 shrink-0">
          <span className="text-xs text-[var(--color-text-muted)]">{video.dateAdded}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 rounded-lg hover:bg-[var(--color-bg-muted)] transition-colors">
              <Archive className="w-4 h-4 text-[var(--color-text-muted)]" />
            </button>
            <button className="p-2 rounded-lg hover:bg-[var(--color-bg-muted)] transition-colors">
              <MoreHorizontal className="w-4 h-4 text-[var(--color-text-muted)]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
