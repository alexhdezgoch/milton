import { Scissors, Play } from 'lucide-react';
import type { Video } from '../types';

interface VideoCardProps {
  video: Video;
  isSelected: boolean;
  onClick: () => void;
}

export default function VideoCard({ video, isSelected, onClick }: VideoCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg transition-colors group
        bg-white border
        ${isSelected
          ? 'border-[var(--color-accent)]'
          : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
        }`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-lg overflow-hidden mb-4 bg-[var(--color-bg-muted)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
            ${isSelected ? 'bg-[var(--color-accent)]' : 'bg-white/10 group-hover:bg-[var(--color-accent)]'}`}>
            <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
          </div>
        </div>
        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
          {video.duration}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-sm text-[var(--color-text)] line-clamp-2 mb-3 leading-snug">
        {video.title}
      </h3>

      {/* Meta row */}
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="flex items-center gap-1 text-[var(--color-accent)] font-medium">
          <Scissors className="w-3 h-3" />
          {video.snipCount} snips
        </span>
        <span className="text-[var(--color-text-muted)]">
          {video.dateAdded}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            video.progress === 100
              ? 'bg-[var(--color-success)]'
              : 'bg-[var(--color-accent)]'
          }`}
          style={{ width: `${video.progress}%` }}
        />
      </div>
      <div className="text-xs text-[var(--color-text-muted)] mt-1.5">
        {video.progress}% watched
      </div>
    </button>
  );
}
