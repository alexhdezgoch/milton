import { useState } from 'react';
import { Link, Plus, Loader2 } from 'lucide-react';

interface URLInputProps {
  onAdd: (url: string) => void;
}

export default function URLInput({ onAdd }: URLInputProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      onAdd(url);
      setUrl('');
      setIsLoading(false);
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-b border-[var(--color-border)]">
      <div className="flex-1 relative">
        <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <input
          type="url"
          placeholder="Paste YouTube URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full pl-10 pr-3 py-2.5 rounded-lg text-sm
            bg-[var(--color-bg-subtle)] border border-transparent
            text-[var(--color-text)] placeholder-[var(--color-text-muted)]
            focus:outline-none focus:border-[var(--color-accent)] focus:bg-white
            transition-colors"
        />
      </div>
      <button
        type="submit"
        disabled={!url.trim() || isLoading}
        className="px-4 py-2.5 rounded-lg text-sm font-medium
          bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
          text-white
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
          flex items-center gap-1.5"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        Add
      </button>
    </form>
  );
}
