import { useState } from 'react';
import { Youtube, Play, Pause, Volume2, Settings, ChevronDown, ChevronUp, Scissors } from 'lucide-react';
import type { Video, TranscriptSegment } from '../types';

interface MainContentProps {
  video: Video | null;
  transcript: TranscriptSegment[];
  onSnip: () => void;
  onAddUrl: (url: string) => void;
}

export default function MainContent({ video, transcript, onSnip, onAddUrl }: MainContentProps) {
  const [url, setUrl] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAddUrl(url);
      setUrl('');
    }
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-white">
      <div className="max-w-3xl mx-auto p-8">
        {/* URL Input */}
        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <input
            type="url"
            placeholder="Paste YouTube URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm
              border border-[var(--color-border)] bg-white
              text-[var(--color-text)] placeholder-[var(--color-text-muted)]
              focus:outline-none focus:border-[var(--color-accent)]
              transition-colors"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg text-sm font-medium
              bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white
              transition-colors flex items-center gap-2"
          >
            + Add
          </button>
        </form>

        {video ? (
          <>
            {/* Video Header */}
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <Youtube className="w-4 h-4 text-[var(--color-text-muted)]" />
                <span className="text-xs text-[var(--color-text-muted)]">youtube.com</span>
              </div>
              <h1 className="text-[32px] font-bold text-[var(--color-text)] leading-tight mb-2">
                {video.title}
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)] mb-5">
                Brad Jacobs • {video.duration}
              </p>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden group mb-5">
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
                    flex items-center justify-center transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-1" fill="white" />
                  )}
                </button>
              </div>

              {/* Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent
                opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between text-white text-sm">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setIsPlaying(!isPlaying)}>
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <Volume2 className="w-4 h-4" />
                    <span className="font-mono text-xs opacity-80">23:48 / 1:23:45</span>
                  </div>
                  <Settings className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Snip Button */}
            <button
              onClick={onSnip}
              className="w-full py-3 px-6 rounded-lg font-semibold text-sm
                bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
                text-white transition-colors
                flex items-center justify-center gap-2 mb-6"
            >
              <Scissors className="w-5 h-5" />
              Snip
            </button>

            {/* Transcript Toggle */}
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="flex items-center gap-2 py-3 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
            >
              {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              View transcript
            </button>

            {/* Transcript Panel */}
            {showTranscript && (
              <div className="mt-4 max-h-[200px] overflow-y-auto rounded-lg bg-[var(--color-bg-subtle)] p-4">
                <div className="space-y-2">
                  {transcript.map((segment, index) => {
                    const isActive = segment.time === '24:03';
                    return (
                      <div
                        key={index}
                        className={`flex gap-4 py-2.5 px-3 rounded-lg transition-colors cursor-pointer
                          ${isActive
                            ? 'bg-[var(--color-accent-subtle)] border-l-2 border-[var(--color-accent)]'
                            : 'hover:bg-[var(--color-bg-muted)]'
                          }`}
                      >
                        <span className={`text-xs font-mono shrink-0 tabular-nums
                          ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}>
                          {segment.time}
                        </span>
                        <p className={`text-sm leading-relaxed
                          ${isActive ? 'text-[var(--color-text)]' : 'text-[var(--color-text-secondary)]'}`}>
                          {segment.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-bg-subtle)] flex items-center justify-center">
              <Youtube className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">No video selected</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Paste a YouTube URL to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
