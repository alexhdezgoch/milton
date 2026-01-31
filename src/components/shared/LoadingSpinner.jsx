import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  return (
    <Loader2 className={`animate-spin text-accent-green ${sizes[size]} ${className}`} />
  )
}

export function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-text-secondary text-sm">{message}</p>
      </div>
    </div>
  )
}

export function LoadingPage({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="xl" />
        <p className="text-text-secondary">{message}</p>
      </div>
    </div>
  )
}
