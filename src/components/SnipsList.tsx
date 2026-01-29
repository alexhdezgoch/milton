import { Scissors } from 'lucide-react';
import type { Snip } from '../types';
import SnipCard from './SnipCard';

interface SnipsListProps {
  snips: Snip[];
  videoId: string | null;
  onToggleFavorite: (snipId: string) => void;
}

export default function SnipsList({ snips, videoId, onToggleFavorite }: SnipsListProps) {
  const videoSnips = snips.filter(s => s.videoId === videoId);

  if (videoSnips.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[var(--color-surface)] flex items-center justify-center">
          <Scissors className="w-8 h-8 text-[var(--color-text-muted)]" />
        </div>
        <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
          No snips yet
        </h3>
        <p className="text-[var(--color-text-muted)] text-sm max-w-xs mx-auto">
          Hit the SNIP button while watching to capture ideas and key moments
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Scissors className="w-4 h-4 text-[var(--color-accent-pink)]" />
        <h3 className="font-semibold text-[var(--color-text-primary)]">
          Your Snips ({videoSnips.length})
        </h3>
      </div>

      <div className="space-y-4">
        {videoSnips.map((snip, index) => (
          <div
            key={snip.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <SnipCard
              snip={snip}
              onToggleFavorite={() => onToggleFavorite(snip.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
