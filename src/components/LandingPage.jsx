import { useState } from 'react'
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

function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Navigation */}
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
            <button onClick={onGetStarted} className="text-text-secondary hover:text-text-primary transition-colors font-medium">
              Log in
            </button>
            <button onClick={onGetStarted} className="px-5 py-2.5 bg-accent-green text-white font-medium rounded-lg hover:bg-accent-green/90 transition-colors">
              Try for free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-5xl md:text-6xl font-semibold text-text-primary mb-6 leading-tight tracking-tighter">
            Never forget another YouTube insight.
          </h1>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Save key moments with one tap. Get AI-powered notes. Actually remember what you learned.
          </p>
          <div className="flex flex-col items-center gap-4">
            <button onClick={onGetStarted} className="px-8 py-4 bg-accent-green text-white text-lg font-medium rounded-xl hover:bg-accent-green/90 transition-colors shadow-medium">
              Try for free
            </button>
            <p className="text-sm text-text-muted">
              7-day free trial · No credit card required · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 px-4 bg-bg-secondary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-text-primary mb-6 tracking-tight">
            You watch. You forget. Sound familiar?
          </h2>
          <p className="text-lg text-text-secondary leading-relaxed">
            You've watched hundreds of hours of tutorials, interviews, and educational content. But how much do you actually remember?
          </p>
          <p className="text-lg text-text-secondary leading-relaxed mt-4">
            Most of us treat YouTube like a stream—valuable insights flow by, and we rarely capture them. <span className="font-semibold text-text-primary">That's where Milton comes in.</span> Think of it as having a really good note-taker sitting next to you.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-text-primary text-center mb-16 tracking-tight">
            From watching to knowing in 3 steps
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Play className="w-8 h-8 text-accent-green" />
              </div>
              <div className="text-sm font-medium text-accent-green mb-2">Step 1</div>
              <h3 className="font-serif text-xl font-semibold text-text-primary mb-3 tracking-tight">Save any video</h3>
              <p className="text-text-secondary">
                Paste a YouTube URL and Milton gets to work—grabbing the transcript and prepping everything so you can focus on watching.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Scissors className="w-8 h-8 text-accent-green" />
              </div>
              <div className="text-sm font-medium text-accent-green mb-2">Step 2</div>
              <h3 className="font-serif text-xl font-semibold text-text-primary mb-3 tracking-tight">Snip the good parts</h3>
              <p className="text-text-secondary">
                Hit snip whenever you hear something worth remembering. Our AI captures the moment with a summary, key points, and exact quote.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-accent-green" />
              </div>
              <div className="text-sm font-medium text-accent-green mb-2">Step 3</div>
              <h3 className="font-serif text-xl font-semibold text-text-primary mb-3 tracking-tight">Chat, search, remember</h3>
              <p className="text-text-secondary">
                Ask questions about any video. Search across your entire library. Get weekly digests of your best insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-bg-secondary">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-text-primary text-center mb-16 tracking-tight">
            Everything you need to learn from video
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: AI Snips */}
            <div className="bg-bg-primary rounded-2xl p-6 border border-border">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                <Scissors className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2 tracking-tight">Capture moments that matter</h3>
              <p className="text-text-secondary text-sm">
                One tap and Milton captures the moment—timestamp, summary, key points, exact quote. You keep watching, Milton keeps notes.
              </p>
            </div>

            {/* Feature 2: Chat with videos */}
            <div className="bg-bg-primary rounded-2xl p-6 border border-border">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2 tracking-tight">Chat with your videos</h3>
              <p className="text-text-secondary text-sm">
                Ask Milton anything about the video. "What did they say about pricing?" He'll find it instantly, with the timestamp so you can jump right there.
              </p>
            </div>

            {/* Feature 3: Smart summaries */}
            <div className="bg-bg-primary rounded-2xl p-6 border border-border">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2 tracking-tight">Know what's inside before you watch</h3>
              <p className="text-text-secondary text-sm">
                Every video gets an AI summary with key topics and takeaways. Decide if it's worth your time in 10 seconds.
              </p>
            </div>

            {/* Feature 4: Full transcripts */}
            <div className="bg-bg-primary rounded-2xl p-6 border border-border">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2 tracking-tight">Search every word</h3>
              <p className="text-text-secondary text-sm">
                Full searchable transcripts with click-to-seek. Find that one thing they said without scrubbing through the whole video.
              </p>
            </div>

            {/* Feature 5: Organization */}
            <div className="bg-bg-primary rounded-2xl p-6 border border-border">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <FolderOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2 tracking-tight">Your video knowledge base</h3>
              <p className="text-text-secondary text-sm">
                Tags, filters, progress tracking. Keep your learning organized without the chaos of browser bookmarks.
              </p>
            </div>

            {/* Feature 6: Weekly digest */}
            <div className="bg-bg-primary rounded-2xl p-6 border border-border">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-accent-rose" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2 tracking-tight">Resurface your best insights</h3>
              <p className="text-text-secondary text-sm">
                Get a weekly email with your snips and highlights. Spaced repetition for video learners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases / Who It's For */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-text-primary text-center mb-16 tracking-tight">
            Built for curious minds
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Students */}
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-accent-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-7 h-7 text-accent-green" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2 tracking-tight">Students</h3>
              <p className="text-text-secondary text-sm">
                Turn lecture recordings into study notes. Snip key concepts, ask clarifying questions, ace the exam.
              </p>
            </div>

            {/* Professionals */}
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2 tracking-tight">Professionals</h3>
              <p className="text-text-secondary text-sm">
                Build expertise from conference talks and tutorials. Your personal library of industry knowledge.
              </p>
            </div>

            {/* Creators & Researchers */}
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2 tracking-tight">Creators & Researchers</h3>
              <p className="text-text-secondary text-sm">
                Collect inspiration, find quotable moments, build topic collections. Never lose a good idea again.
              </p>
            </div>

            {/* Lifelong learners */}
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


      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-text-primary mb-4 tracking-tight">
            Simple pricing. Serious value.
          </h2>

          <div className="bg-bg-primary rounded-3xl border-2 border-accent-green/20 p-8 mt-12 shadow-medium">
            <div className="text-5xl font-bold text-text-primary mb-2">
              $10<span className="text-xl font-normal text-text-muted">/month</span>
            </div>
            <p className="text-text-secondary mb-8">Everything included. No tiers, no limits.</p>

            <div className="space-y-4 mb-8 text-left">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-accent-green" />
                <span className="text-text-secondary">Unlimited video saves</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-accent-green" />
                <span className="text-text-secondary">AI-powered snips & summaries</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-accent-green" />
                <span className="text-text-secondary">Chat with your videos</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-accent-green" />
                <span className="text-text-secondary">Full transcript access</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-accent-green" />
                <span className="text-text-secondary">Tags & organization</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-accent-green" />
                <span className="text-text-secondary">Weekly digest emails</span>
              </div>
            </div>

            <button onClick={onGetStarted} className="w-full py-4 bg-accent-green text-white text-lg font-medium rounded-xl hover:bg-accent-green/90 transition-colors">
              Try free for 7 days
            </button>

            <p className="text-sm text-text-muted mt-4">
              Cancel anytime. No questions asked.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 bg-bg-secondary">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-text-primary text-center mb-12 tracking-tight">
            Questions? We've got answers.
          </h2>

          <div className="space-y-4">
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

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-accent-green">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">
            Ready to actually remember what you watch?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Give Milton a try. Your future self (and your notes) will thank you.
          </p>
          <button onClick={onGetStarted} className="px-8 py-4 bg-white text-accent-green text-lg font-medium rounded-xl hover:bg-white/90 transition-colors shadow-medium">
            Try for free
          </button>
        </div>
      </section>

      {/* Footer */}
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
              <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="mailto:hello@miltonapp.co" className="text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// FAQ Accordion Item Component
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
