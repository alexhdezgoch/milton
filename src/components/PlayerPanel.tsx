import { useState } from 'react';
import { Youtube, Play, Pause, Volume2, Settings, ChevronDown, ChevronUp, Scissors } from 'lucide-react';
import type { Video, TranscriptSegment } from '../types';

interface PlayerPanelProps {
  video: Video;
  transcript: TranscriptSegment[];
  onSnip: () => void;
}

export default function PlayerPanel({ video, transcript, onSnip }: PlayerPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [progress, setProgress] = useState(35);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6">
        {/* Source label */}
        <div className="flex items-center gap-2 mb-3">
          <Youtube className="w-4 h-4 text-[var(--color-text-muted)]" />
          <span className="text-xs text-[var(--color-text-muted)]">youtube.com</span>
        </div>

        {/* Title */}
        <h1 className="font-bold text-[32px] text-[var(--color-text)] leading-tight">
          {video.title}
        </h1>

        {/* Author & duration */}
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Brad Jacobs • {video.duration}
        </p>

        {/* Video player */}
        <div className="mt-6 relative aspect-video rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden group">
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

          {/* Controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent
            opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Progress bar */}
            <div
              className="w-full h-1 rounded-full bg-white/30 mb-3 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = ((e.clientX - rect.left) / rect.width) * 100;
                setProgress(Math.max(0, Math.min(100, percent)));
              }}
            >
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-white text-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <Volume2 className="w-4 h-4" />
                <span className="font-mono text-xs">23:48 / 1:23:45</span>
              </div>
              <Settings className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Snip button */}
        <button
          onClick={onSnip}
          className="w-full mt-8 py-3 px-6 rounded-lg font-semibold text-sm
            bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
            text-white transition-colors
            flex items-center justify-center gap-2"
        >
          <Scissors className="w-5 h-5" />
          Snip
        </button>

        {/* Transcript toggle */}
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full mt-4 py-3 flex items-center justify-between text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
        >
          <span>View transcript</span>
          {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Transcript panel */}
        {showTranscript && (
          <div className="mt-2 max-h-[300px] overflow-y-auto rounded-lg bg-[var(--color-bg-subtle)] p-4 animate-fade-in">
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
                    <span className={`text-xs font-mono shrink-0 pt-0.5 tabular-nums
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
      </div>
    </div>
  );
}
