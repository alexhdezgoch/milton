import { useRef, useEffect } from 'react';
import { FileText } from 'lucide-react';
import type { TranscriptSegment } from '../types';

interface TranscriptPanelProps {
  transcript: TranscriptSegment[];
  activeTime?: string;
}

export default function TranscriptPanel({ transcript, activeTime = '24:03' }: TranscriptPanelProps) {
  const activeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const active = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();

      const scrollTop = active.offsetTop - container.offsetTop - (containerRect.height / 2) + (activeRect.height / 2);
      container.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }
  }, [activeTime]);

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-[var(--color-text-muted)]" />
        <h3 className="font-semibold text-sm text-[var(--color-text)]">Live Transcript</h3>
      </div>

      <div ref={containerRef} className="h-[200px] overflow-y-auto space-y-2 scrollbar-thin">
        {transcript.map((segment, index) => {
          const isActive = segment.time === activeTime;
          return (
            <div
              key={index}
              ref={isActive ? activeRef : null}
              className={`flex gap-3 py-2.5 px-3 rounded-lg transition-colors cursor-pointer
                ${isActive
                  ? 'bg-[var(--color-accent-subtle)]'
                  : 'hover:bg-[var(--color-bg-muted)]'
                }`}
            >
              <span className={`text-xs font-mono shrink-0 pt-0.5 tabular-nums
                ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}>
                {segment.time}
              </span>
              <p className={`text-sm leading-relaxed
                ${isActive ? 'text-[var(--color-text)] font-medium' : 'text-[var(--color-text-secondary)]'}`}>
                {segment.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
