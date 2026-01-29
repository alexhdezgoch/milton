import { useState } from 'react';
import { Youtube, Play, Pause, Volume2, Settings, ChevronDown, ChevronUp, Scissors, Star, Sparkles, RefreshCw } from 'lucide-react';
import type { Video, Snip, TranscriptSegment } from '../types';

interface MainPanelProps {
  video: Video | null;
  snips: Snip[];
  transcript: TranscriptSegment[];
  onSnip: () => void;
  onToggleFavorite: (snipId: string) => void;
  onAddUrl: (url: string) => void;
}

export default function MainPanel({ video, snips, transcript, onSnip, onToggleFavorite, onAddUrl }: MainPanelProps) {
  const [url, setUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'snips' | 'info' | 'chat'>('snips');
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
        <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
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
            <div className="mb-6">
              <div className="flex items-center gap-1.5 mb-2">
                <Youtube className="w-4 h-4 text-[var(--color-text-muted)]" />
                <span className="text-xs text-[var(--color-text-muted)]">youtube.com</span>
              </div>
              <h1 className="text-[32px] font-bold text-[var(--color-text)] leading-tight mb-2">
                {video.title}
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Brad Jacobs • {video.duration}
              </p>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden group mb-6">
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
              className="flex items-center gap-2 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] mb-6 transition-colors"
            >
              {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              View transcript
            </button>

            {/* Transcript Panel */}
            {showTranscript && (
              <div className="mb-8 max-h-[200px] overflow-y-auto rounded-lg bg-[var(--color-bg-subtle)] p-4">
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

            {/* Tabs */}
            <div className="flex gap-6 border-b border-[var(--color-border)] mb-6">
              {(['snips', 'info', 'chat'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm capitalize transition-colors border-b-2 -mb-[1px]
                    ${activeTab === tab
                      ? 'text-[var(--color-text)] border-[var(--color-accent)] font-medium'
                      : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text-secondary)]'
                    }`}
                >
                  {tab === 'snips' ? `Snips (${snips.length})` : tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'snips' && (
              <div>
                {snips.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-[var(--color-text-muted)]">No snips yet</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Click Snip to capture ideas</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--color-border)]">
                    {snips.map((snip) => (
                      <SnipRow
                        key={snip.id}
                        snip={snip}
                        onToggleFavorite={() => onToggleFavorite(snip.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'info' && (
              <div className="space-y-4">
                <InfoRow label="Source" value="YouTube" />
                <InfoRow label="Channel" value="Brad Jacobs" />
                <InfoRow label="Duration" value="1:23:45" />
                <InfoRow label="Progress" value={`${video.progress}%`} />
                <InfoRow label="Added" value={video.dateAdded} />
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="text-center py-12">
                <p className="text-sm text-[var(--color-text-muted)]">AI Chat coming soon</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-bg-subtle)] flex items-center justify-center">
              <Youtube className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">No video selected</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Paste a YouTube URL to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3 border-b border-[var(--color-border)]">
      <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
      <span className="text-sm text-[var(--color-text)]">{value}</span>
    </div>
  );
}

function SnipRow({ snip, onToggleFavorite }: { snip: Snip; onToggleFavorite: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="py-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <h3 className="text-base font-semibold text-[var(--color-text)] leading-snug">
            {snip.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-[var(--color-text-muted)]">
              {snip.timestampStart} - {snip.timestampEnd}
            </span>
            <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
              <Sparkles className="w-3 h-3" />
              By AI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`p-2 rounded-lg transition-colors
              ${snip.isFavorite
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-border-strong)] hover:text-[var(--color-accent)]'
              }`}
          >
            <Star className={`w-4 h-4 ${snip.isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bullets */}
      <ul className="mt-4 space-y-2">
        {snip.summary.map((point, index) => (
          <li key={index} className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]">
            <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)] mt-2 shrink-0" />
            <span className="leading-relaxed">{point}</span>
          </li>
        ))}
      </ul>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-5 pt-5 border-t border-[var(--color-border)] space-y-4">
          {/* Quote */}
          <div className="pl-4 border-l-2 border-[var(--color-accent)]">
            <p className="text-sm italic text-[var(--color-text-secondary)] leading-relaxed">
              "{snip.quote}"
            </p>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">— {snip.speaker}</p>
          </div>

          {/* Full transcript */}
          <div className="p-4 rounded-lg bg-[var(--color-bg-subtle)] text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {snip.transcript}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button className="flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors">
              <Play className="w-3.5 h-3.5" />
              Play segment
            </button>
            <button className="flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              Rewrite
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
