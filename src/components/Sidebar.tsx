import { Home, Library, Tag, Search, Scissors } from 'lucide-react';
import type { Video } from '../types';

interface SidebarProps {
  videos: Video[];
  selectedVideoId: string | null;
  onVideoSelect: (videoId: string) => void;
}

export default function Sidebar({ videos, selectedVideoId, onVideoSelect }: SidebarProps) {
  const navItems = [
    { icon: Home, label: 'Home' },
    { icon: Library, label: 'Library', active: true },
    { icon: Tag, label: 'Tags' },
    { icon: Search, label: 'Search' },
  ];

  return (
    <div className="w-[220px] h-screen bg-[var(--color-bg-subtle)] flex flex-col border-r border-[var(--color-border)]">
      {/* Logo */}
      <div className="px-4 pt-4 pb-6 border-b border-[var(--color-border)] mb-4">
        <div className="flex items-center gap-2.5">
          <Scissors className="w-5 h-5 text-[var(--color-accent)]" />
          <span className="text-base font-bold text-[var(--color-text)]">Milton</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <button
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
                  ${item.active
                    ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)]'
                  }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Video list */}
      <div className="flex-1 overflow-y-auto mt-6 px-4">
        <div className="space-y-2">
          {videos.map((video) => (
            <VideoItem
              key={video.id}
              video={video}
              isSelected={selectedVideoId === video.id}
              onClick={() => onVideoSelect(video.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function VideoItem({
  video,
  isSelected,
  onClick
}: {
  video: Video;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-colors
        ${isSelected
          ? 'bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]'
          : 'hover:bg-[var(--color-bg-muted)] border border-transparent'
        }`}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="w-[60px] shrink-0">
          <div className="aspect-video rounded bg-gradient-to-br from-gray-200 to-gray-300" />
          {/* Progress bar */}
          <div className="mt-1.5 h-[2px] rounded-full bg-[var(--color-border)] overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)]"
              style={{ width: `${video.progress}%` }}
            />
          </div>
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0 py-1">
          <h4 className={`text-sm font-medium leading-snug line-clamp-2
            ${isSelected ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>
            {video.title}
          </h4>
        </div>
      </div>
    </button>
  );
}
