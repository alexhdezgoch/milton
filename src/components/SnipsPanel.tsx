import { useState } from 'react';
import { Star, ChevronDown, Play, Sparkles } from 'lucide-react';
import type { Snip } from '../types';

interface SnipsPanelProps {
  snips: Snip[];
  onToggleFavorite: (snipId: string) => void;
}

export default function SnipsPanel({ snips, onToggleFavorite }: SnipsPanelProps) {
  const [activeTab, setActiveTab] = useState<'notebook' | 'info' | 'chat'>('notebook');

  return (
    <div className="w-[380px] border-l border-[var(--color-border)] flex flex-col h-full bg-white">
      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)]">
        {(['notebook', 'info', 'chat'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm capitalize transition-colors
              ${activeTab === tab
                ? 'text-[var(--color-text)] border-b-2 border-[var(--color-accent)] -mb-[1px]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
          >
            {tab === 'notebook' ? 'Snips' : tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'notebook' && (
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[var(--color-text)]">
                Snips ({snips.length})
              </h3>
            </div>

            {/* Snips list */}
            {snips.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-[var(--color-text-muted)]">No snips yet</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Click Snip to capture ideas</p>
              </div>
            ) : (
              <div className="space-y-3">
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
          <div className="p-4 space-y-4">
            <InfoRow label="Source" value="YouTube" />
            <InfoRow label="Channel" value="Brad Jacobs" />
            <InfoRow label="Duration" value="1:23:45" />
            <InfoRow label="Progress" value="35%" />
            <InfoRow label="Added" value="2 days ago" />
            <InfoRow label="Language" value="English" />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="p-4 text-center py-12">
            <p className="text-sm text-[var(--color-text-muted)]">AI Chat coming soon</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Ask questions about this video</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
      <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
      <span className="text-sm text-[var(--color-text)]">{value}</span>
    </div>
  );
}

function SnipRow({ snip, onToggleFavorite }: { snip: Snip; onToggleFavorite: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`group rounded-lg transition-colors
      ${isExpanded ? 'bg-[var(--color-bg-subtle)]' : 'hover:bg-[var(--color-bg-subtle)]'}`}
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-base text-[var(--color-text)]">
              {snip.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[var(--color-text-muted)]">
                {snip.timestampStart} - {snip.timestampEnd}
              </span>
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <Sparkles className="w-3 h-3" />
                By AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={`p-2 rounded-lg transition-colors ${
                snip.isFavorite ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-accent)]'
              }`}
            >
              <Star className={`w-4 h-4 ${snip.isFavorite ? 'fill-current' : ''}`} />
            </button>
            <div className={`p-2 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
            </div>
          </div>
        </div>

        {/* Bullets */}
        <ul className="mt-4 space-y-2">
          {snip.summary.map((point, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
              <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)] mt-1.5 shrink-0" />
              <span className="leading-snug">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          {/* Quote */}
          <div className="pl-3 border-l-2 border-[var(--color-accent)]">
            <p className="text-sm italic text-[var(--color-text-secondary)] leading-relaxed">
              "{snip.quote}"
            </p>
            <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">— {snip.speaker}</p>
          </div>

          {/* Full transcript */}
          <div className="p-3 rounded-lg bg-white text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {snip.transcript}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button className="flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors">
              <Play className="w-3.5 h-3.5" />
              Play segment
            </button>
            <button className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors">
              Rewrite
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
