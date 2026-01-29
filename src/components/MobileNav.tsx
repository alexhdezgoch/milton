import { Library, Play, Search } from 'lucide-react';

interface MobileNavProps {
  activeView: 'library' | 'player';
  onViewChange: (view: 'library' | 'player') => void;
}

export default function MobileNav({ activeView, onViewChange }: MobileNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-[var(--color-border)]">
      <div className="flex">
        <button
          onClick={() => onViewChange('library')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors
            ${activeView === 'library' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}
        >
          <Library className="w-5 h-5" />
          <span className="text-xs">Library</span>
        </button>

        <button
          onClick={() => onViewChange('player')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors
            ${activeView === 'player' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}
        >
          <Play className="w-5 h-5" />
          <span className="text-xs">Player</span>
        </button>

        <button className="flex-1 flex flex-col items-center gap-1 py-3 text-[var(--color-text-muted)]">
          <Search className="w-5 h-5" />
          <span className="text-xs">Search</span>
        </button>
      </div>
    </div>
  );
}
