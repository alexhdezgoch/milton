import { useState } from 'react';
import { Play, Pause, Volume2, Maximize, Settings } from 'lucide-react';

interface VideoPlayerProps {
  videoTitle?: string;
}

export default function VideoPlayer({ videoTitle }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35);

  return (
    <div className="w-full">
      {/* Player container */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-white group">
        {/* Video background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]" />

        {/* Center play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
              flex items-center justify-center cursor-pointer
              transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-1" fill="white" />
            )}
          </button>
        </div>

        {/* Title overlay */}
        {videoTitle && (
          <div className="absolute bottom-16 left-0 right-0 text-center px-8">
            <p className="text-white/50 text-sm line-clamp-1">
              {videoTitle}
            </p>
          </div>
        )}

        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-16
          opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Progress bar */}
          <div
            className="w-full h-1 rounded-full bg-white/20 mb-4 cursor-pointer group/progress"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = ((e.clientX - rect.left) / rect.width) * 100;
              setProgress(Math.max(0, Math.min(100, percent)));
            }}
          >
            <div
              className="h-full rounded-full bg-[var(--color-accent)] relative transition-all"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white
                opacity-0 group-hover/progress:opacity-100 scale-0 group-hover/progress:scale-100 transition-all" />
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-white/90 hover:text-white transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button className="text-white/90 hover:text-white transition-colors">
                <Volume2 className="w-5 h-5" />
              </button>
              <span className="text-white/70 text-sm font-mono">
                23:48 / 1:23:45
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-white/90 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button className="text-white/90 hover:text-white transition-colors">
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
