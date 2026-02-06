function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-serif text-4xl font-semibold text-text-primary mb-8 tracking-tight">
          Privacy Policy
        </h1>

        <p className="text-text-secondary mb-6">
          Last updated: February 5, 2026
        </p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-text-primary mb-4 tracking-tight">
              Overview
            </h2>
            <p className="text-text-secondary mb-4">
              Milton ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how our Chrome extension and web application collect, use, and safeguard your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-text-primary mb-4 tracking-tight">
              What We Collect
            </h2>

            <h3 className="text-lg font-semibold text-text-primary mb-2 mt-6">Account Information</h3>
            <p className="text-text-secondary mb-4">
              When you create an account, we collect your email address for authentication and communication purposes.
            </p>

            <h3 className="text-lg font-semibold text-text-primary mb-2 mt-6">Video Data</h3>
            <p className="text-text-secondary mb-4">
              When you save a YouTube video or create a snip, we store:
            </p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>YouTube video URL and ID</li>
              <li>Video title, author, and thumbnail URL</li>
              <li>Video transcript (fetched from YouTube's captions)</li>
              <li>Timestamps and notes you create (snips)</li>
              <li>AI-generated summaries and notes</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary mb-2 mt-6">Usage Data</h3>
            <p className="text-text-secondary mb-4">
              We may collect anonymous usage statistics to improve the service, such as feature usage patterns and error reports.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-text-primary mb-4 tracking-tight">
              What We Don't Collect
            </h2>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>We do not collect your YouTube login credentials</li>
              <li>We do not access your YouTube watch history or subscriptions</li>
              <li>We do not track your browsing activity outside of our extension functionality</li>
              <li>We do not sell or share your personal data with third parties for advertising</li>
              <li>We do not access any videos or data you don't explicitly save to Milton</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-text-primary mb-4 tracking-tight">
              How We Use Your Data
            </h2>
            <p className="text-text-secondary mb-4">
              Your data is used solely to provide the Milton service:
            </p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Store and sync your saved videos and snips across devices</li>
              <li>Generate AI-powered summaries and notes using the video transcript</li>
              <li>Enable chat functionality to ask questions about your videos</li>
              <li>Send weekly digest emails (if enabled)</li>
              <li>Process subscription payments via Stripe</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-text-primary mb-4 tracking-tight">
              Data Storage & Security
            </h2>
            <p className="text-text-secondary mb-4">
              Your data is stored securely using Supabase, a trusted database provider with enterprise-grade security. All data is encrypted in transit (TLS) and at rest. We implement row-level security to ensure you can only access your own data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-text-primary mb-4 tracking-tight">
              Third-Party Services
            </h2>
            <p className="text-text-secondary mb-4">
              We use the following third-party services:
            </p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li><strong>Supabase</strong> - Database and authentication</li>
              <li><strong>Anthropic (Claude)</strong> - AI-powered summaries and chat</li>
              <li><strong>Stripe</strong> - Payment processing</li>
              <li><strong>YouTube</strong> - Video playback and transcript fetching</li>
            </ul>
            <p className="text-text-secondary mb-4">
              Each service has its own privacy policy governing their use of data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-text-primary mb-4 tracking-tight">
              Chrome Extension Permissions
            </h2>
            <p className="text-text-secondary mb-4">
              The Milton Chrome extension requests the following permissions:
            </p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li><strong>storage</strong> - To store your snips locally and sync authentication state</li>
              <li><strong>activeTab</strong> - To interact with YouTube pages when you click the snip button</li>
              <li><strong>Host permissions for youtube.com</strong> - To inject the snip button into YouTube video pages</li>
              <li><strong>Host permissions for our API</strong> - To sync data with your Milton account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-text-primary mb-4 tracking-tight">
              Your Rights
            </h2>
            <p className="text-text-secondary mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Access your data at any time through the Milton app</li>
              <li>Delete individual videos or snips</li>
              <li>Request complete deletion of your account and all associated data</li>
              <li>Export your data upon request</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-text-primary mb-4 tracking-tight">
              Data Retention
            </h2>
            <p className="text-text-secondary mb-4">
              We retain your data for as long as your account is active. If you cancel your subscription, your data remains accessible in read-only mode. If you delete your account, all data is permanently deleted within 30 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-text-primary mb-4 tracking-tight">
              Changes to This Policy
            </h2>
            <p className="text-text-secondary mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any significant changes via email or through the app.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-text-primary mb-4 tracking-tight">
              Contact Us
            </h2>
            <p className="text-text-secondary mb-4">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-text-secondary">
              <a href="mailto:privacy@miltonapp.co" className="text-accent-green hover:underline">
                privacy@miltonapp.co
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy
