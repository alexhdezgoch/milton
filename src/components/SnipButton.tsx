import { useState } from 'react';
import { Scissors } from 'lucide-react';

interface SnipButtonProps {
  onSnip: () => void;
  disabled?: boolean;
}

export default function SnipButton({ onSnip, disabled }: SnipButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (disabled || isAnimating) return;

    setIsAnimating(true);
    onSnip();

    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isAnimating}
      className={`
        relative w-full py-3 px-6 rounded-lg font-semibold text-sm
        bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
        text-white
        transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        overflow-hidden
      `}
    >
      <Scissors className={`w-5 h-5 transition-transform duration-150 ${isAnimating ? 'rotate-12' : ''}`} />
      <span>Snip</span>
    </button>
  );
}
