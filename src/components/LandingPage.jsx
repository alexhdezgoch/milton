import { useState, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'
import {
  Play,
  Scissors,
  MessageSquare,
  FileText,
  Sparkles,
  FolderOpen,
  Mail,
  Check,
  ChevronDown,
  GraduationCap,
  Briefcase,
  Lightbulb,
  BookOpen,
  Youtube
} from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

function LandingPage({ onGetStarted }) {
  const heroRef = useRef(null)
  const heroTitleRef = useRef(null)

  // Inject FAQPage schema for SEO
  useState(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What videos work with Milton?",
          "acceptedAnswer": { "@type": "Answer", "text": "Any YouTube video with captions/subtitles. That's most educational content, talks, interviews, and tutorials." }
        },
        {
          "@type": "Question",
          "name": "How is this different from YouTube's save feature?",
          "acceptedAnswer": { "@type": "Answer", "text": "YouTube lets you save videos. Milton lets you save insights. Our AI captures specific moments, generates summaries, and lets you search and chat with your content." }
        },
        {
          "@type": "Question",
          "name": "Can I try it before paying?",
          "acceptedAnswer": { "@type": "Answer", "text": "Absolutely. You get 7 days free with full access to everything. No credit card required to start." }
        },
        {
          "@type": "Question",
          "name": "What happens to my data if I cancel?",
          "acceptedAnswer": { "@type": "Answer", "text": "Your videos and snips stay in your account. You just won't be able to add new content until you resubscribe." }
        },
        {
          "@type": "Question",
          "name": "Is there a mobile app?",
          "acceptedAnswer": { "@type": "Answer", "text": "Not yet! Milton works great in mobile browsers. Native apps are on the roadmap." }
        }
      ]
    }
    let el = document.getElementById('faq-schema-home')
    if (!el) {
      el = document.createElement('script')
      el.id = 'faq-schema-home'
      el.type = 'application/ld+json'
      document.head.appendChild(el)
    }
    el.textContent = JSON.stringify(schema)
  })

  useLayoutEffect(() => {
    // ── Lenis smooth scroll ──────────────────────────────────────────────
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    // ── Hero: word-by-word reveal ────────────────────────────────────────
    const words = heroTitleRef.current?.querySelectorAll('.hero-word')
    if (words?.length) {
      gsap.fromTo(words,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.08, delay: 0.15 }
      )
    }
    gsap.fromTo('.hero-sub',
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.65, ease: 'power3.out', delay: 0.75 }
    )
    gsap.fromTo('.hero-actions',
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 1.0 }
    )

    // ── Hero parallax ────────────────────────────────────────────────────
    if (heroRef.current) {
      gsap.to('.hero-content', {
        y: -50,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })
    }

    // ── Generic scroll reveals ────────────────────────────────────────────
    gsap.utils.toArray('.reveal-up').forEach((el) => {
      gsap.fromTo(el,
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }
      )
    })

    // ── Staggered card groups ─────────────────────────────────────────────
    gsap.utils.toArray('.stagger-group').forEach((container) => {
      gsap.fromTo(Array.from(container.children),
        { y: 32, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: 0.09,
          scrollTrigger: { trigger: container, start: 'top 85%', once: true },
        }
      )
    })

    // ── Counter animations ─────────────────────────────────────────────────
    document.querySelectorAll('[data-count]').forEach((el) => {
      const target = parseInt(el.dataset.count, 10)
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter() {
          const obj = { v: 0 }
          gsap.to(obj, {
            v: target,
            duration: 1.8,
            ease: 'power2.out',
            onUpdate() {
              el.textContent = Math.round(obj.v).toLocaleString() + '+'
            },
          })
        },
      })
    })

    // ── Magnetic buttons ───────────────────────────────────────────────────
    const magneticCleanups = []
    document.querySelectorAll('.magnetic').forEach((btn) => {
      const onMove = (e) => {
        const r = btn.getBoundingClientRect()
        gsap.to(btn, {
          x: (e.clientX - r.left - r.width / 2) * 0.25,
          y: (e.clientY - r.top - r.height / 2) * 0.25,
          duration: 0.3,
          ease: 'power2.out',
        })
      }
      const onLeave = () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
      }
      btn.addEventListener('mousemove', onMove)
      btn.addEventListener('mouseleave', onLeave)
      magneticCleanups.push(() => {
        btn.removeEventListener('mousemove', onMove)
        btn.removeEventListener('mouseleave', onLeave)
      })
    })

    // ── Smooth anchor scroll ───────────────────────────────────────────────
    const anchorCleanups = []
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      const fn = (e) => {
        const target = document.querySelector(a.getAttribute('href'))
        if (target) { e.preventDefault(); lenis.scrollTo(target) }
      }
      a.addEventListener('click', fn)
      anchorCleanups.push(() => a.removeEventListener('click', fn))
    })

    return () => {
      lenis.destroy()
      gsap.ticker.remove(tick)
      ScrollTrigger.getAll().forEach((t) => t.kill())
      magneticCleanups.forEach((fn) => fn())
      anchorCleanups.forEach((fn) => fn())
    }
  }, [])

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-x-hidden">

      {/* Grain / noise texture overlay — CSS-only, purely decorative */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          pointerEvents: 'none',
          opacity: 0.028,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent-green rounded-lg flex items-center justify-center">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-accent-green tracking-tight">Milton</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-text-secondary hover:text-text-primary transition-colors">Features</a>
            <a href="#pricing" className="text-text-secondary hover:text-text-primary transition-colors">Pricing</a>
            <a href="#faq" className="text-text-secondary hover:text-text-primary transition-colors">FAQ</a>
            <a href="/youtube-note-taking-app" className="text-text-secondary hover:text-text-primary transition-colors font-medium">Note-Taking App</a>
            <button onClick={onGetStarted} className="text-text-secondary hover:text-text-primary transition-colors font-medium">
              Log in
            </button>
            <button
              onClick={onGetStarted}
              className="magnetic px-5 py-2.5 bg-accent-green text-white font-medium rounded-lg hover:bg-accent-green/90 transition-colors"
            >
              Try for free
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="hero-section pt-32 pb-20 px-4">
        <div className="hero-content max-w-4xl mx-auto text-center">
          {/* Hidden H1 for SEO crawlers — full readable text with spaces */}
          <h1 className="sr-only">Never forget another YouTube insight.</h1>
          {/* Visual animated version — kept for UX */}
          <p
            ref={heroTitleRef}
            aria-hidden="true"
            className="font-serif text-5xl md:text-6xl font-semibold text-text-primary mb-6 leading-tight tracking-tighter"
          >
            {['Never', 'forget', 'another', 'YouTube', 'insight.'].map((word, i, arr) => (
              <span
                key={i}
                className="hero-word inline-block"
                style={{ marginRight: i < arr.length - 1 ? '0.28em' : 0, opacity: 0 }}
              >
                {word}
              </span>
            ))}
          </p>
          <p className="hero-sub text-xl text-text-secondary mb-8 max-w-2xl mx-auto" style={{ opacity: 0 }}>
            Save key moments with one tap. Get AI-powered notes. Actually remember what you learned.
          </p>
          <div className="hero-actions flex flex-col items-center gap-4" style={{ opacity: 0 }}>
            <button
              onClick={onGetStarted}
              className="magnetic px-8 py-4 bg-accent-green text-white text-lg font-medium rounded-xl hover:bg-accent-green/90 transition-colors shadow-medium"
            >
              Try for free
            </button>
            <p className="text-sm text-text-muted">
              7-day free trial · No credit card required · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* ── Problem Statement ────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-bg-secondary">
        <div className="max-w-3xl mx-auto text-center reveal-up">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-text-primary mb-6 tracking-tight">
            You watch. You forget. Sound familiar?
          </h2>
          <p className="text-lg text-text-secondary leading-relaxed">
            You've burned hundreds of hours on tutorials, interviews, and deep-dives. But when someone asks what you learned last week? Blank.
          </p>
          <p className="text-lg text-text-secondary leading-relaxed mt-4">
            YouTube is a stream. Insights flow by and disappear.{' '}
            <span className="font-semibold text-text-primary">
              Milton is the <a href="/youtube-note-taking-app" className="text-accent-green hover:underline">YouTube note-taking app</a> that turns it into a library you can search, revisit, and actually remember.
            </span>
          </p>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="reveal-up font-serif text-3xl md:text-4xl font-semibold text-text-primary text-center mb-4 tracking-tight">
            From watching to knowing in 3 steps
          </h2>
          <p className="reveal-up text-center text-text-secondary mb-16">
            Milton is the <a href="/youtube-note-taking-app" className="text-accent-green hover:underline font-medium">YouTube note-taking app</a> built for how you actually learn — no extensions, no friction.
          </p>
          <div className="stagger-group grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Play className="w-8 h-8 text-accent-green" />
              </div>
              <div className="text-sm font-medium text-accent-green mb-2">Step 1</div>
              <h3 className="font-serif text-xl font-semibold text-text-primary mb-3 tracking-tight">Save any video</h3>
              <p className="text-text-secondary">
                Paste a YouTube URL. Milton grabs the transcript and loads the video — ready for you to watch and snip.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Scissors className="w-8 h-8 text-accent-green" />
              </div>
              <div className="text-sm font-medium text-accent-green mb-2">Step 2</div>
              <h3 className="font-serif text-xl font-semibold text-text-primary mb-3 tracking-tight">Snip the good parts</h3>
              <p className="text-text-secondary">
                Hear something worth keeping? Hit snip. Milton captures the moment with timestamp, summary, and exact quote.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-accent-green" />
              </div>
              <div className="text-sm font-medium text-accent-green mb-2">Step 3</div>
              <h3 className="font-serif text-xl font-semibold text-text-primary mb-3 tracking-tight">Chat, search, remember</h3>
              <p className="text-text-secondary">
                Ask questions about any video. Search your whole library. Get your best insights back in a weekly digest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 bg-bg-secondary">
        <div className="max-w-5xl mx-auto">
          <h2 className="reveal-up font-serif text-3xl md:text-4xl font-semibold text-text-primary text-center mb-16 tracking-tight">
            Everything you need to learn from video
          </h2>
          <div className="stagger-group grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-bg-primary rounded-2xl p-6 border border-border">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                <Scissors className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2 tracking-tight">Capture moments that matter</h3>
              <p className="text-text-secondary text-sm">
                One tap. Milton saves the timestamp, summary, key points, and exact quote. You keep watching.
              </p>
            </div>
            <div className="bg-bg-primary rounded-2xl p-6 border border-border">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2 tracking-tight">Chat with your videos</h3>
              <p className="text-text-secondary text-sm">
                "What did they say about pricing?" Milton finds it instantly, with the exact timestamp to jump right there.
              </p>
            </div>
            <div className="bg-bg-primary rounded-2xl p-6 border border-border">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2 tracking-tight">Know what's inside before you watch</h3>
              <p className="text-text-secondary text-sm">
                Every video gets an AI summary with key topics. Decide if it's worth your time in 10 seconds.
              </p>
            </div>
            <div className="bg-bg-primary rounded-2xl p-6 border border-border">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2 tracking-tight">Search every word</h3>
              <p className="text-text-secondary text-sm">
                Full searchable transcripts with click-to-seek. Find that exact quote without scrubbing through anything.
              </p>
            </div>
            <div className="bg-bg-primary rounded-2xl p-6 border border-border">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <FolderOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2 tracking-tight">Your video knowledge base</h3>
              <p className="text-text-secondary text-sm">
                Tags, filters, progress tracking. All your learning organized — no more chaos of browser bookmarks.
              </p>
            </div>
            <div className="bg-bg-primary rounded-2xl p-6 border border-border">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-accent-rose" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2 tracking-tight">Resurface your best insights</h3>
              <p className="text-text-secondary text-sm">
                Weekly email with your snips and highlights. Spaced repetition for video learners — your notes come back to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who It's For ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="reveal-up font-serif text-3xl md:text-4xl font-semibold text-text-primary text-center mb-16 tracking-tight">
            Built for curious minds
          </h2>
          <div className="stagger-group grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-accent-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-7 h-7 text-accent-green" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2 tracking-tight">Students</h3>
              <p className="text-text-secondary text-sm">
                Turn lecture recordings into study notes. Snip key concepts, ace the exam.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2 tracking-tight">Professionals</h3>
              <p className="text-text-secondary text-sm">
                Build expertise from conference talks and tutorials. Your personal library of industry knowledge.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2 tracking-tight">Creators & Researchers</h3>
              <p className="text-text-secondary text-sm">
                Collect inspiration, find quotable moments, build topic collections. Never lose a good idea again.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2 tracking-tight">Lifelong learners</h3>
              <p className="text-text-secondary text-sm">
                Watch smarter, not more. Actually retain the wisdom from your favorite educators and thinkers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-bg-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <p className="reveal-up text-sm font-semibold text-accent-green uppercase tracking-widest mb-12">
            People are watching smarter
          </p>
          <div className="stagger-group grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="text-center">
              <div className="font-serif text-4xl font-bold text-text-primary mb-1">
                <span data-count="1000">0+</span>
              </div>
              <p className="text-sm text-text-secondary">videos saved this week</p>
            </div>
            <div className="text-center">
              <div className="font-serif text-4xl font-bold text-text-primary mb-1">
                <span data-count="12000">0+</span>
              </div>
              <p className="text-sm text-text-secondary">snips created</p>
            </div>
            <div className="text-center">
              <div className="font-serif text-4xl font-bold text-text-primary mb-1">
                <span data-count="4800">0+</span>
              </div>
              <p className="text-sm text-text-secondary">digest emails sent</p>
            </div>
            <div className="text-center">
              <div className="font-serif text-4xl font-bold text-text-primary mb-1">
                <span data-count="500">0+</span>
              </div>
              <p className="text-sm text-text-secondary">active learners</p>
            </div>
          </div>
          <div className="stagger-group grid md:grid-cols-3 gap-6">
            <div className="bg-bg-primary rounded-2xl p-6 border border-border text-left">
              <p className="text-text-secondary text-sm mb-4 leading-relaxed">
                "I've tried every note-taking app. Milton is the only one that actually fits into my watching flow. I don't have to pause and write — I just snip and keep going."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent-green/20 rounded-full flex items-center justify-center text-sm font-bold text-accent-green">J</div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Jamie R.</p>
                  <p className="text-xs text-text-muted">PhD student</p>
                </div>
              </div>
            </div>
            <div className="bg-bg-primary rounded-2xl p-6 border border-border text-left">
              <p className="text-text-secondary text-sm mb-4 leading-relaxed">
                "The weekly digest is genuinely one of the best product features I've seen in years. My notes come back to me. I actually remember what I watched."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">M</div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Marcus T.</p>
                  <p className="text-xs text-text-muted">Product manager</p>
                </div>
              </div>
            </div>
            <div className="bg-bg-primary rounded-2xl p-6 border border-border text-left">
              <p className="text-text-secondary text-sm mb-4 leading-relaxed">
                "I research for YouTube content all day. Milton is now my most-used tool. I can build a research library from any channel in an afternoon."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-sm font-bold text-amber-600">S</div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Sofia L.</p>
                  <p className="text-xs text-text-muted">Content creator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="reveal-up font-serif text-3xl md:text-4xl font-semibold text-text-primary mb-3 tracking-tight">
            Simple pricing. Serious value.
          </h2>
          <p className="reveal-up text-base text-text-secondary mb-0">
            Less than a coffee. More than a textbook.
          </p>
          <div className="reveal-up bg-bg-primary rounded-3xl border-2 border-accent-green/20 p-8 mt-10 shadow-medium">
            <div className="text-5xl font-bold text-text-primary mb-2">
              $10<span className="text-xl font-normal text-text-muted">/month</span>
            </div>
            <p className="text-text-secondary mb-8">Everything included. No tiers, no limits.</p>
            <div className="space-y-4 mb-8 text-left">
              {[
                'Unlimited video saves',
                'AI-powered snips & summaries',
                'Chat with your videos',
                'Full transcript access',
                'Tags & organization',
                'Weekly digest emails',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-accent-green flex-shrink-0" />
                  <span className="text-text-secondary">{feature}</span>
                </div>
              ))}
            </div>
            <button
              onClick={onGetStarted}
              className="magnetic w-full py-4 bg-accent-green text-white text-lg font-medium rounded-xl hover:bg-accent-green/90 transition-colors"
            >
              Start your 7-day free trial
            </button>
            <p className="text-sm text-text-muted mt-4">No credit card required. Cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-4 bg-bg-secondary">
        <div className="max-w-3xl mx-auto">
          <h2 className="reveal-up font-serif text-3xl md:text-4xl font-semibold text-text-primary text-center mb-12 tracking-tight">
            Questions? We've got answers.
          </h2>
          <div className="space-y-4 reveal-up">
            <FAQItem
              question="What videos work with Milton?"
              answer="Any YouTube video with captions/subtitles. That's most educational content, talks, interviews, and tutorials."
            />
            <FAQItem
              question="How is this different from YouTube's save feature?"
              answer="YouTube lets you save videos. Milton lets you save insights. Our AI captures specific moments, generates summaries, and lets you search and chat with your content."
            />
            <FAQItem
              question="Can I try it before paying?"
              answer="Absolutely. You get 7 days free with full access to everything. No credit card required to start."
            />
            <FAQItem
              question="What happens to my data if I cancel?"
              answer="Your videos and snips stay in your account. You just won't be able to add new content until you resubscribe."
            />
            <FAQItem
              question="Is there a mobile app?"
              answer="Not yet! Milton works great in mobile browsers. Native apps are on the roadmap."
            />
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-accent-green">
        <div className="max-w-3xl mx-auto text-center reveal-up">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">
            Stop forgetting. Start knowing.
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Seven days free. No credit card. Paste a URL and see what you've been missing.
          </p>
          <button
            onClick={onGetStarted}
            className="magnetic px-8 py-4 bg-white text-accent-green text-lg font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-medium"
          >
            Try Milton free →
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-12 px-4 bg-video-dark">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent-green rounded-lg flex items-center justify-center">
                <Youtube className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">Milton</span>
              <span className="text-gray-400 ml-2">— Your nerdy friend for video learning.</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="/youtube-note-taking-app" className="text-gray-400 hover:text-white transition-colors">YouTube Note-Taking App</a>
              <a href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</a>
              <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="mailto:hello@miltonapp.co" className="text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── FAQ Accordion ─────────────────────────────────────────────────────────────
function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-bg-primary rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-bg-secondary transition-colors"
      >
        <span className="font-medium text-text-primary">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
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

export default LandingPage
