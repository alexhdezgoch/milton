import { useEffect } from 'react'
import { Youtube } from 'lucide-react'
import { getArticleBySlug } from '../data/articles'

// Simple markdown-to-HTML renderer (no dependencies needed)
function renderMarkdown(md) {
  if (!md) return ''
  let html = md
    // Escape HTML first (except we'll put it back)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Process line by line
  const lines = html.split('\n')
  const result = []
  let inUL = false
  let inOL = false
  let inBlockquote = false
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Headings
    if (/^### (.+)/.test(line)) {
      if (inUL) { result.push('</ul>'); inUL = false }
      if (inOL) { result.push('</ol>'); inOL = false }
      if (inBlockquote) { result.push('</blockquote>'); inBlockquote = false }
      result.push(`<h3>${inlineFormat(line.replace(/^### /, ''))}</h3>`)
    } else if (/^## (.+)/.test(line)) {
      if (inUL) { result.push('</ul>'); inUL = false }
      if (inOL) { result.push('</ol>'); inOL = false }
      if (inBlockquote) { result.push('</blockquote>'); inBlockquote = false }
      result.push(`<h2>${inlineFormat(line.replace(/^## /, ''))}</h2>`)
    } else if (/^# (.+)/.test(line)) {
      if (inUL) { result.push('</ul>'); inUL = false }
      if (inOL) { result.push('</ol>'); inOL = false }
      if (inBlockquote) { result.push('</blockquote>'); inBlockquote = false }
      result.push(`<h1>${inlineFormat(line.replace(/^# /, ''))}</h1>`)
    }
    // Blockquote
    else if (/^> (.+)/.test(line)) {
      if (inUL) { result.push('</ul>'); inUL = false }
      if (inOL) { result.push('</ol>'); inOL = false }
      if (!inBlockquote) { result.push('<blockquote>'); inBlockquote = true }
      result.push(`<p>${inlineFormat(line.replace(/^> /, ''))}</p>`)
    }
    // Unordered list
    else if (/^[-*] (.+)/.test(line)) {
      if (inOL) { result.push('</ol>'); inOL = false }
      if (inBlockquote) { result.push('</blockquote>'); inBlockquote = false }
      if (!inUL) { result.push('<ul>'); inUL = true }
      result.push(`<li>${inlineFormat(line.replace(/^[-*] /, ''))}</li>`)
    }
    // Ordered list
    else if (/^\d+\. (.+)/.test(line)) {
      if (inUL) { result.push('</ul>'); inUL = false }
      if (inBlockquote) { result.push('</blockquote>'); inBlockquote = false }
      if (!inOL) { result.push('<ol>'); inOL = true }
      result.push(`<li>${inlineFormat(line.replace(/^\d+\. /, ''))}</li>`)
    }
    // Horizontal rule
    else if (/^---+$/.test(line.trim())) {
      if (inUL) { result.push('</ul>'); inUL = false }
      if (inOL) { result.push('</ol>'); inOL = false }
      if (inBlockquote) { result.push('</blockquote>'); inBlockquote = false }
      result.push('<hr />')
    }
    // Empty line
    else if (line.trim() === '') {
      if (inUL) { result.push('</ul>'); inUL = false }
      if (inOL) { result.push('</ol>'); inOL = false }
      if (inBlockquote) { result.push('</blockquote>'); inBlockquote = false }
    }
    // Paragraph
    else {
      if (inUL) { result.push('</ul>'); inUL = false }
      if (inOL) { result.push('</ol>'); inOL = false }
      if (inBlockquote) { result.push('</blockquote>'); inBlockquote = false }
      result.push(`<p>${inlineFormat(line)}</p>`)
    }
    i++
  }

  if (inUL) result.push('</ul>')
  if (inOL) result.push('</ol>')
  if (inBlockquote) result.push('</blockquote>')

  return result.join('\n')
}

function inlineFormat(text) {
  return text
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
}

const ROUTE_LABELS = {
  blog: 'Blog',
  vs: 'Comparison',
  for: 'Use Case',
}

export default function ArticlePage({ slug, routeType, onGetStarted }) {
  const article = getArticleBySlug(slug)

  // Set SEO meta tags dynamically
  useEffect(() => {
    if (!article) return
    document.title = `${article.title} | Milton`
    
    // Meta description
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta) }
    meta.content = article.description

    // OG tags
    const setOg = (prop, val) => {
      let el = document.querySelector(`meta[property="${prop}"]`)
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el) }
      el.content = val
    }
    setOg('og:title', article.title)
    setOg('og:description', article.description)
    setOg('og:type', 'article')
    setOg('og:url', window.location.href)

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
    canonical.href = window.location.href
  }, [article])

  if (!article) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-semibold text-text-primary mb-4">Article not found</h1>
          <a href="/" className="text-accent-green hover:underline">← Back to home</a>
        </div>
      </div>
    )
  }

  const bodyHtml = renderMarkdown(article.body)
  const sectionLabel = ROUTE_LABELS[article.routeType] || 'Blog'

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

      {/* Article */}
      <main className="pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-text-muted mb-8">
            <a href="/" className="hover:text-text-primary transition-colors">Home</a>
            <span>/</span>
            <a href={`/${article.routeType}`} className="hover:text-text-primary transition-colors capitalize">{sectionLabel}</a>
            <span>/</span>
            <span className="text-text-secondary truncate max-w-[200px]">{article.title}</span>
          </nav>

          {/* Category badge */}
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-accent-green/10 text-accent-green text-xs font-semibold rounded-full uppercase tracking-wide">
              {sectionLabel}
            </span>
          </div>

          {/* Article content */}
          <article>
            <div
              className="prose-article"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          </article>

          {/* Internal links for /for/ pages */}
          {article.routeType === 'for' && (
            <div className="mt-12 p-6 bg-bg-secondary rounded-2xl border border-border">
              <h3 className="font-semibold text-text-primary mb-4 text-sm uppercase tracking-wide">Explore Milton</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="/youtube-note-taking-app" className="text-accent-green hover:underline font-medium">
                    → Milton: The YouTube Note-Taking App
                  </a>
                  <span className="text-text-muted ml-2">— Full overview of features & pricing</span>
                </li>
                <li>
                  <a href="/blog/best-youtube-note-taking-app" className="text-accent-green hover:underline font-medium">
                    → Best YouTube Note-Taking Apps (2026 Comparison)
                  </a>
                  <span className="text-text-muted ml-2">— How Milton stacks up against the alternatives</span>
                </li>
                <li>
                  <a href="/blog/active-recall-youtube" className="text-accent-green hover:underline font-medium">
                    → Active Recall for YouTube Learning
                  </a>
                  <span className="text-text-muted ml-2">— The science of retaining what you watch</span>
                </li>
                <li>
                  <a href="/blog/how-to-learn-youtube" className="text-accent-green hover:underline font-medium">
                    → How to Learn Effectively from YouTube
                  </a>
                  <span className="text-text-muted ml-2">— Systems and strategies for serious learners</span>
                </li>
                <li>
                  <a href="/for" className="text-accent-green hover:underline font-medium">
                    → More use cases
                  </a>
                  <span className="text-text-muted ml-2">— See how different learners use Milton</span>
                </li>
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 p-8 bg-bg-secondary rounded-2xl border border-border text-center">
            <div className="w-12 h-12 bg-accent-green rounded-xl flex items-center justify-center mx-auto mb-4">
              <Youtube className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-serif text-2xl font-semibold text-text-primary mb-3 tracking-tight">
              Stop forgetting what you learn on YouTube.
            </h3>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              Milton captures key moments, generates AI-powered notes, and helps you actually remember what you watch.
            </p>
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-accent-green text-white text-lg font-medium rounded-xl hover:bg-accent-green/90 transition-colors shadow-medium"
            >
              Try Milton free for 7 days
            </button>
            <p className="text-sm text-text-muted mt-3">No credit card required · Cancel anytime</p>
          </div>
        </div>
      </main>

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
