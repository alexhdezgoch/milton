import { useState } from 'react';
import { Star, ChevronDown, Play, Sparkles, RefreshCw } from 'lucide-react';
import type { Video, Snip } from '../types';

interface RightSidebarProps {
  video: Video | null;
  snips: Snip[];
  onToggleFavorite: (snipId: string) => void;
}

export default function RightSidebar({ video, snips, onToggleFavorite }: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<'snips' | 'info' | 'chat'>('snips');

  return (
    <div className="w-[340px] h-screen border-l border-[var(--color-border)] flex flex-col bg-white">
      {/* Tab row */}
      <div className="px-6 pt-6">
        <div className="flex gap-6 pb-4 border-b border-[var(--color-border)] mb-5">
          {(['snips', 'info', 'chat'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm capitalize transition-colors pb-4 -mb-[17px] border-b-2
                ${activeTab === tab
                  ? 'text-[var(--color-text)] border-[var(--color-accent)] font-medium'
                  : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text-secondary)]'
                }`}
            >
              {tab === 'snips' ? `Snips (${snips.length})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6">
        {activeTab === 'snips' && (
          <div>
            {snips.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-[var(--color-text-muted)]">No snips yet</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-2">Click Snip to capture ideas</p>
              </div>
            ) : (
              <div>
                {snips.map((snip, index) => (
                  <SnipCard
                    key={snip.id}
                    snip={snip}
                    onToggleFavorite={() => onToggleFavorite(snip.id)}
                    isLast={index === snips.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'info' && video && (
          <div className="space-y-4">
            <InfoRow label="Source" value="YouTube" />
            <InfoRow label="Channel" value="Brad Jacobs" />
            <InfoRow label="Duration" value={video.duration} />
            <InfoRow label="Progress" value={`${video.progress}%`} />
            <InfoRow label="Added" value={video.dateAdded} />
          </div>
        )}

        {activeTab === 'info' && !video && (
          <div className="text-center py-16">
            <p className="text-sm text-[var(--color-text-muted)]">Select a video to see info</p>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="text-center py-16">
            <p className="text-sm text-[var(--color-text-muted)]">AI Chat coming soon</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-2">Ask questions about this video</p>
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

function SnipCard({
  snip,
  onToggleFavorite,
  isLast
}: {
  snip: Snip;
  onToggleFavorite: () => void;
  isLast: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`py-6 ${!isLast ? 'border-b border-[var(--color-border)]' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <h3 className="text-base font-semibold text-[var(--color-text)] leading-snug">
            {snip.title}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-[var(--color-text-muted)]">
              {snip.timestampStart} - {snip.timestampEnd}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
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
            className={`p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-all
              ${isExpanded ? 'rotate-180' : ''}`}
          >
            <ChevronDown className="w-4 h-4" />
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
        <div className="mt-6 pt-6 border-t border-[var(--color-border)] space-y-4">
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
            <button className="flex items-center gap-2 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors">
              <Play className="w-3.5 h-3.5" />
              Play segment
            </button>
            <button className="flex items-center gap-2 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              Rewrite
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
