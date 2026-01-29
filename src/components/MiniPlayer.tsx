import { Play, Pause, Scissors, X } from 'lucide-react';
import { useState } from 'react';

interface MiniPlayerProps {
  videoTitle: string;
  snipCount: number;
  onExpand: () => void;
  onClose: () => void;
}

export default function MiniPlayer({ videoTitle, snipCount, onExpand, onClose }: MiniPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe lg:left-[280px]">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white backdrop-blur-lg rounded-lg p-3
          border border-[var(--color-border)]
          flex items-center gap-3
          shadow-lg">
          {/* Thumbnail */}
          <button
            onClick={onExpand}
            className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] shrink-0
              flex items-center justify-center group transition-colors"
          >
            <Play className="w-4 h-4 text-white group-hover:text-[var(--color-accent)] transition-colors" />
          </button>

          {/* Info */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onExpand}>
            <h4 className="font-medium text-sm text-[var(--color-text)] truncate hover:text-[var(--color-accent)] transition-colors">
              {videoTitle}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-xs text-[var(--color-accent)]">
                <Scissors className="w-3 h-3" />
                {snipCount} snips
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">•</span>
              <span className="text-xs text-[var(--color-text-muted)] font-mono">23:48</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2.5 rounded-lg bg-[var(--color-bg-muted)] hover:bg-[var(--color-border)] transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-[var(--color-text)]" />
              ) : (
                <Play className="w-4 h-4 text-[var(--color-text)]" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
