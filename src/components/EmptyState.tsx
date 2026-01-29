import { Youtube } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-bg-subtle)] flex items-center justify-center">
          <Youtube className="w-8 h-8 text-[var(--color-text-muted)]" />
        </div>
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-1">
          No videos yet
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Paste a YouTube URL to get started
        </p>
      </div>
    </div>
  );
}
