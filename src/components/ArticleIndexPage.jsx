import { Youtube, ArrowRight } from 'lucide-react'
import { getArticlesByType } from '../data/articles'

const CONFIG = {
  blog: {
    title: 'Blog',
    description: 'Practical guides on learning from YouTube, building knowledge systems, and retaining what you watch.',
    heading: 'Learn smarter with YouTube',
  },
  vs: {
    title: 'Comparisons',
    description: 'Honest comparisons of Milton with other tools — so you can choose what works best for your learning workflow.',
    heading: 'How Milton compares',
  },
  for: {
    title: 'Use Cases',
    description: 'How different types of learners use Milton to capture and retain YouTube knowledge.',
    heading: 'Built for every learner',
  },
}

export default function ArticleIndexPage({ routeType, onGetStarted }) {
  const articles = getArticlesByType(routeType)
  const config = CONFIG[routeType] || CONFIG.blog

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-x-hidden">
      {/* Grain texture */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
          opacity: 0.028,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat', backgroundSize: '256px 256px',
        }}
      />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent-green rounded-lg flex items-center justify-center">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-accent-green tracking-tight">Milton</span>
          </a>
          <div className="hidden md:flex items-center gap-6">
            <a href="/#features" className="text-text-secondary hover:text-text-primary transition-colors">Features</a>
            <a href="/#pricing" className="text-text-secondary hover:text-text-primary transition-colors">Pricing</a>
            <a href="/blog" className="text-text-secondary hover:text-text-primary transition-colors">Blog</a>
            <button
              onClick={onGetStarted}
              className="px-5 py-2.5 bg-accent-green text-white font-medium rounded-lg hover:bg-accent-green/90 transition-colors"
            >
              Try for free
            </button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-16 px-4 bg-bg-secondary border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 bg-accent-green/10 text-accent-green text-xs font-semibold rounded-full uppercase tracking-wide mb-4">
            {config.title}
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-text-primary mb-4 tracking-tight">
            {config.heading}
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            {config.description}
          </p>
        </div>
      </section>

      {/* Articles grid */}
      <main className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <a
                key={article.slug}
                href={`/${routeType}/${article.slug}`}
                className="group block bg-bg-primary border border-border rounded-xl p-6 hover:border-accent-green/40 hover:shadow-medium transition-all duration-200"
              >
                <div className="mb-3">
                  <span className="inline-block px-2 py-0.5 bg-accent-green/10 text-accent-green text-xs font-medium rounded-full">
                    {article.category}
                  </span>
                </div>
                <h2 className="font-serif text-lg font-semibold text-text-primary mb-2 leading-snug tracking-tight group-hover:text-accent-green transition-colors">
                  {article.title}
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
                  {article.description}
                </p>
                <div className="flex items-center gap-1 mt-4 text-accent-green text-sm font-medium">
                  Read article <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>

      {/* CTA */}
      <section className="py-16 px-4 bg-bg-secondary border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl font-semibold text-text-primary mb-4 tracking-tight">
            Ready to remember everything you watch?
          </h2>
          <p className="text-text-secondary mb-6">
            Join thousands of learners who use Milton to capture and retain YouTube knowledge.
          </p>
          <button
            onClick={onGetStarted}
            className="px-8 py-4 bg-accent-green text-white text-lg font-medium rounded-xl hover:bg-accent-green/90 transition-colors shadow-medium"
          >
            Try Milton free for 7 days
          </button>
          <p className="text-sm text-text-muted mt-3">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent-green rounded-md flex items-center justify-center">
              <Youtube className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-accent-green">Milton</span>
          </div>
          <p className="text-sm text-text-muted">© 2026 Milton. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-text-muted">
            <a href="/privacy" className="hover:text-text-primary transition-colors">Privacy</a>
            <a href="/blog" className="hover:text-text-primary transition-colors">Blog</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
