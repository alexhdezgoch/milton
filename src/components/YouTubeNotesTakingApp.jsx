import { useEffect } from 'react'
import { Youtube, Check, Play, Scissors, MessageSquare, FileText, Sparkles, FolderOpen, Mail, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { analytics } from '../lib/analytics'

export default function YouTubeNoteTakingApp({ onGetStarted }) {
  const handleTrialStart = (source) => () => { analytics.trialStart(source); onGetStarted() }
  useEffect(() => {
    document.title = 'YouTube Note-Taking App — Milton'
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta) }
    meta.content = 'Milton is the best YouTube note-taking app. Save key moments, get AI summaries, chat with videos, and never forget what you learned. Free 7-day trial.'

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
    canonical.href = 'https://miltonapp.co/youtube-note-taking-app'

    // FAQPage schema
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is a YouTube note-taking app?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A YouTube note-taking app lets you save timestamped insights from YouTube videos, generate AI summaries, and organize your learning. Milton is purpose-built for this — capturing moments, creating notes, and surfacing your best insights weekly."
          }
        },
        {
          "@type": "Question",
          "name": "Is Milton the best YouTube note-taking app?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Milton is the only YouTube note-taking app built specifically for the YouTube workflow — no browser extension needed, AI summaries on every video, full-transcript search, and a weekly digest to keep your insights fresh."
          }
        },
        {
          "@type": "Question",
          "name": "Do I need a Chrome extension to use Milton?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Milton works entirely from the web app. Paste a YouTube URL, and Milton loads the video, pulls the transcript, and lets you snip and take notes — no extension install required."
          }
        },
        {
          "@type": "Question",
          "name": "How much does Milton cost?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Milton is $10/month after a 7-day free trial. No credit card required to start."
          }
        }
      ]
    }
    let schemaEl = document.getElementById('faq-schema-yta')
    if (!schemaEl) {
      schemaEl = document.createElement('script')
      schemaEl.id = 'faq-schema-yta'
      schemaEl.type = 'application/ld+json'
      document.head.appendChild(schemaEl)
    }
    schemaEl.textContent = JSON.stringify(schema)

    return () => {
      const el = document.getElementById('faq-schema-yta')
      if (el) el.remove()
    }
  }, [])

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
              onClick={handleTrialStart('money_page_nav')}
              className="px-5 py-2.5 bg-accent-green text-white font-medium rounded-lg hover:bg-accent-green/90 transition-colors"
            >
              Try for free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-3 py-1 bg-accent-green/10 text-accent-green text-xs font-semibold rounded-full uppercase tracking-wide mb-6">
            YouTube Note-Taking App
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-semibold text-text-primary mb-6 leading-tight tracking-tighter">
            The YouTube note-taking app that actually helps you remember
          </h1>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Save key moments from any YouTube video. Get AI-powered notes and summaries. Resurface your best insights every week. No browser extension required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleTrialStart('money_page_hero')}
              className="px-8 py-4 bg-accent-green text-white text-lg font-medium rounded-xl hover:bg-accent-green/90 transition-colors shadow-medium"
            >
              Try for free — 7 days
            </button>
            <a
              href="/blog/best-youtube-note-taking-app"
              className="px-8 py-4 border border-border text-text-primary text-lg font-medium rounded-xl hover:bg-bg-secondary transition-colors"
            >
              See comparison →
            </a>
          </div>
          <p className="text-sm text-text-muted mt-4">No credit card required · Cancel anytime · $10/mo after trial</p>
        </div>
      </section>

      {/* Why Milton */}
      <section className="py-20 px-4 bg-bg-secondary">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-text-primary text-center mb-4 tracking-tight">
            Why Milton is the best YouTube note-taking app
          </h2>
          <p className="text-center text-text-secondary mb-16 max-w-2xl mx-auto">
            Other tools were built for documents, web pages, or podcasts. Milton was built from the ground up for YouTube — the way you actually learn from video.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Scissors className="w-6 h-6 text-amber-600" />,
                bg: 'bg-amber-100',
                title: 'Timestamped snips',
                desc: 'Hit snip on any moment. Milton captures the timestamp, AI summary, and exact quote — without pausing your flow.'
              },
              {
                icon: <Sparkles className="w-6 h-6 text-purple-600" />,
                bg: 'bg-purple-100',
                title: 'AI video summaries',
                desc: 'Every video gets an automatic AI summary. Know what\'s inside before committing to a 2-hour watch.'
              },
              {
                icon: <MessageSquare className="w-6 h-6 text-blue-600" />,
                bg: 'bg-blue-100',
                title: 'Chat with your videos',
                desc: '"What did they say about pricing strategy?" Ask in plain English. Milton finds it and jumps you to the timestamp.'
              },
              {
                icon: <FileText className="w-6 h-6 text-green-600" />,
                bg: 'bg-green-100',
                title: 'Full transcript search',
                desc: 'Search every word ever said across your entire video library. Click a result to jump to that exact moment.'
              },
              {
                icon: <FolderOpen className="w-6 h-6 text-indigo-600" />,
                bg: 'bg-indigo-100',
                title: 'Tags & organization',
                desc: 'Tag videos by topic, track progress, filter by what you\'ve saved. Your video knowledge base, organized.'
              },
              {
                icon: <Mail className="w-6 h-6 text-rose-500" />,
                bg: 'bg-rose-100',
                title: 'Weekly digest',
                desc: 'Your best moments from the week land in your inbox. Spaced repetition for YouTube — retention on autopilot.'
              },
            ].map((f) => (
              <div key={f.title} className="bg-bg-primary rounded-2xl p-6 border border-border">
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-serif text-lg font-semibold text-text-primary mb-2 tracking-tight">{f.title}</h3>
                <p className="text-text-secondary text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-text-primary text-center mb-16 tracking-tight">
            How this YouTube note-taking app works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: <Play className="w-8 h-8 text-accent-green" />, title: 'Paste a YouTube URL', desc: 'Milton loads the video and pulls the full transcript automatically. Ready to watch in seconds.' },
              { step: '2', icon: <Scissors className="w-8 h-8 text-accent-green" />, title: 'Snip what matters', desc: 'Press snip when you hear something worth keeping. Timestamp, AI note, and quote — saved instantly.' },
              { step: '3', icon: <MessageSquare className="w-8 h-8 text-accent-green" />, title: 'Search, chat, remember', desc: 'Search your whole library, chat with any video, and receive a weekly digest of your best insights.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 bg-accent-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  {s.icon}
                </div>
                <div className="text-sm font-medium text-accent-green mb-2">Step {s.step}</div>
                <h3 className="font-serif text-xl font-semibold text-text-primary mb-3 tracking-tight">{s.title}</h3>
                <p className="text-text-secondary">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-bg-secondary">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-text-primary mb-3 tracking-tight">
            Simple pricing
          </h2>
          <p className="text-base text-text-secondary mb-10">One plan. Everything included. Cancel anytime.</p>
          <div className="bg-bg-primary rounded-3xl border-2 border-accent-green/20 p-8 shadow-medium">
            <div className="text-5xl font-bold text-text-primary mb-2">
              $10<span className="text-xl font-normal text-text-muted">/month</span>
            </div>
            <p className="text-text-secondary mb-8">7-day free trial · No credit card required</p>
            <div className="space-y-4 mb-8 text-left">
              {[
                'Unlimited video saves',
                'AI-powered snips & summaries',
                'Chat with your videos',
                'Full transcript search',
                'Tags & organization',
                'Weekly digest emails',
              ].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-accent-green flex-shrink-0" />
                  <span className="text-text-secondary">{f}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => { analytics.pricingCtaClick('money_page_pricing'); onGetStarted() }}
              className="w-full py-4 bg-accent-green text-white text-lg font-medium rounded-xl hover:bg-accent-green/90 transition-colors"
            >
              Start free trial
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-text-primary text-center mb-12 tracking-tight">
            YouTube note-taking app FAQ
          </h2>
          <div className="space-y-4">
            <FAQItem
              question="What is a YouTube note-taking app?"
              answer="A YouTube note-taking app lets you save timestamped insights from YouTube videos, generate AI summaries, and organize your learning. Milton is purpose-built for this — capturing moments, creating notes, and surfacing your best insights weekly."
            />
            <FAQItem
              question="Is Milton the best YouTube note-taking app?"
              answer="Milton is the only YouTube note-taking app built specifically for the YouTube workflow — no browser extension needed, AI summaries on every video, full-transcript search, and a weekly digest to keep your insights fresh."
            />
            <FAQItem
              question="Do I need a Chrome extension to use Milton?"
              answer="No. Milton works entirely from the web app. Paste a YouTube URL, and Milton loads the video, pulls the transcript, and lets you snip and take notes — no extension install required."
            />
            <FAQItem
              question="How is Milton different from YouTube's native save feature?"
              answer="YouTube lets you save videos to a playlist. Milton lets you save insights — specific moments, AI-generated notes, and searchable quotes — from those videos. It's the difference between a bookmark and a knowledge base."
            />
            <FAQItem
              question="How much does Milton cost?"
              answer="Milton is $10/month after a 7-day free trial. No credit card required to start."
            />
          </div>
        </div>
      </section>

      {/* Internal links section */}
      <section className="py-16 px-4 bg-bg-secondary">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-2xl font-semibold text-text-primary text-center mb-10 tracking-tight">
            Learn more about YouTube note-taking
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <a href="/blog/best-youtube-note-taking-app" className="bg-bg-primary rounded-xl p-6 border border-border hover:border-accent-green/40 transition-colors">
              <h3 className="font-semibold text-text-primary mb-2">Best YouTube Note-Taking Apps (2026)</h3>
              <p className="text-text-secondary text-sm">Honest comparison of every tool on the market — pros, cons, and who each is right for.</p>
            </a>
            <a href="/blog/active-recall-youtube" className="bg-bg-primary rounded-xl p-6 border border-border hover:border-accent-green/40 transition-colors">
              <h3 className="font-semibold text-text-primary mb-2">Active Recall for YouTube Learning</h3>
              <p className="text-text-secondary text-sm">Why passive watching fails and how to actually remember what you watch.</p>
            </a>
            <a href="/blog/how-to-learn-youtube" className="bg-bg-primary rounded-xl p-6 border border-border hover:border-accent-green/40 transition-colors">
              <h3 className="font-semibold text-text-primary mb-2">How to Learn from YouTube Effectively</h3>
              <p className="text-text-secondary text-sm">The complete system for turning YouTube time into real knowledge.</p>
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-accent-green">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">
            The YouTube note-taking app you've been looking for.
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Seven days free. No credit card. Paste a URL and see what you've been missing.
          </p>
          <button
            onClick={handleTrialStart('money_page_cta')}
            className="px-8 py-4 bg-white text-accent-green text-lg font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-medium"
          >
            Try Milton free →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-video-dark">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent-green rounded-lg flex items-center justify-center">
                <Youtube className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">Milton</span>
            </a>
            <div className="flex items-center gap-6 text-sm">
              <a href="/" className="text-gray-400 hover:text-white transition-colors">Home</a>
              <a href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</a>
              <a href="/vs" className="text-gray-400 hover:text-white transition-colors">Comparisons</a>
              <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="mailto:hello@miltonapp.co" className="text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-bg-secondary rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-bg-primary transition-colors"
      >
        <span className="font-medium text-text-primary">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-text-muted transition-transform flex-shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-text-secondary">{answer}</p>
        </div>
      )}
    </div>
  )
}
