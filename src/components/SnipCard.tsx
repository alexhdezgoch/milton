import { useState, useRef, useEffect } from 'react';
import { Star, Share2, ChevronDown, Play, RefreshCw, Sparkles } from 'lucide-react';
import type { Snip } from '../types';

interface SnipCardProps {
  snip: Snip;
  onToggleFavorite: () => void;
}

export default function SnipCard({ snip, onToggleFavorite }: SnipCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isExpanded]);

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg overflow-hidden transition-colors
      hover:border-[var(--color-border-strong)]"
    >
      {/* Main content - always visible */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-[var(--color-text)]">
                {snip.title}
              </h4>
              <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-muted)] px-2 py-0.5 rounded">
                <Sparkles className="w-3 h-3" />
                By AI
              </span>
            </div>
            <p className="text-xs font-mono text-[var(--color-text-muted)] mt-1">
              {snip.timestampStart} - {snip.timestampEnd}
            </p>
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
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-accent)]'
                }`}
            >
              <Star className={`w-4 h-4 ${snip.isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <div className={`p-2 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
            </div>
          </div>
        </div>

        {/* Summary bullets */}
        <ul className="space-y-2 mt-4">
          {snip.summary.map((point, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]">
              <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)] mt-2 shrink-0" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Expanded content */}
      <div
        className="overflow-hidden transition-all duration-150 ease-out"
        style={{ maxHeight: isExpanded ? contentHeight : 0 }}
      >
        <div ref={contentRef} className="px-4 pb-4 space-y-4">
          {/* Divider */}
          <div className="h-px bg-[var(--color-border)]" />

          {/* Quote block */}
          <div className="relative pl-4 border-l-2 border-[var(--color-accent)]">
            <blockquote className="italic text-[var(--color-text-secondary)] text-sm leading-relaxed">
              "{snip.quote}"
            </blockquote>
            <cite className="block mt-2 text-xs text-[var(--color-text-muted)] not-italic">
              — {snip.speaker}
            </cite>
          </div>

          {/* Full transcript */}
          <div>
            <h5 className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">
              Full Transcript
            </h5>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-bg-subtle)] p-4 rounded-lg">
              {snip.transcript}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
              bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
              text-white text-sm font-medium transition-colors">
              <Play className="w-4 h-4" />
              Replay Snip
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
              border border-[var(--color-border-strong)] hover:bg-[var(--color-bg-muted)]
              text-[var(--color-text)] text-sm font-medium transition-colors">
              <RefreshCw className="w-4 h-4" />
              Rewrite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
