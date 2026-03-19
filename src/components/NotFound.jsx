import { useEffect } from 'react'
import { Youtube } from 'lucide-react'

export default function NotFound() {
  useEffect(() => {
    document.title = 'Page Not Found — Milton'
  }, [])

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Nav */}
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent-green rounded-lg flex items-center justify-center">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-accent-green tracking-tight">Milton</span>
          </a>
        </div>
      </nav>

      {/* 404 Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="font-serif text-8xl font-bold text-accent-green/20 mb-4">404</div>
          <h1 className="font-serif text-3xl font-semibold text-text-primary mb-4 tracking-tight">
            Page not found
          </h1>
          <p className="text-text-secondary mb-8">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="px-6 py-3 bg-accent-green text-white font-medium rounded-xl hover:bg-accent-green/90 transition-colors"
            >
              ← Back to homepage
            </a>
            <a
              href="/youtube-note-taking-app"
              className="px-6 py-3 border border-border text-text-primary font-medium rounded-xl hover:bg-bg-secondary transition-colors"
            >
              YouTube Note-Taking App
            </a>
          </div>
          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm text-text-muted mb-4">Or explore our content:</p>
            <div className="flex flex-wrap gap-3 justify-center text-sm">
              <a href="/blog" className="text-accent-green hover:underline">Blog</a>
              <span className="text-text-muted">·</span>
              <a href="/vs" className="text-accent-green hover:underline">Comparisons</a>
              <span className="text-text-muted">·</span>
              <a href="/for" className="text-accent-green hover:underline">Use Cases</a>
              <span className="text-text-muted">·</span>
              <a href="/privacy" className="text-accent-green hover:underline">Privacy</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
