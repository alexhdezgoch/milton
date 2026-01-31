# Milton Setup Guide

This guide walks you through setting up Milton, a YouTube video note-taking app.

## Prerequisites

- Node.js 18+
- A Supabase account
- A Stripe account (for payments)
- An Anthropic account (for Claude AI)
- A Resend account (for emails, optional)

## 1. Clone and Install

```bash
cd milton
npm install
```

## 2. Supabase Setup

### Create Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned

### Run Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase/schema.sql`
3. Run the SQL to create all tables, RLS policies, and triggers

### Enable Authentication

1. Go to Authentication > Providers
2. Enable Email provider (email confirmations optional for development)
3. (Optional) Enable Google OAuth:
   - Go to Google Cloud Console
   - Create OAuth 2.0 credentials
   - Add authorized redirect URL: `https://your-project.supabase.co/auth/v1/callback`
   - Add client ID and secret to Supabase

### Get API Keys

1. Go to Project Settings > API
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## 3. Stripe Setup

### Create Product

1. Go to [stripe.com](https://stripe.com) dashboard
2. Go to Products > Add Product
3. Create a product named "Milton Pro" with:
   - Price: $10/month
   - Recurring billing
4. Copy the **Price ID** (starts with `price_`)

### Get API Keys

1. Go to Developers > API keys
2. Copy:
   - **Publishable key** → `VITE_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY` (Supabase secret)

### Set Up Webhook

1. Go to Developers > Webhooks
2. Add endpoint:
   - URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
3. Copy the **Webhook signing secret** → `STRIPE_WEBHOOK_SECRET`

## 4. Claude AI Setup

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Copy the key → `ANTHROPIC_API_KEY` (Supabase secret)

## 5. Resend Setup (Optional - for Weekly Digest)

1. Go to [resend.com](https://resend.com)
2. Create an account and verify your domain
3. Get your API key → `RESEND_API_KEY` (Supabase secret)
4. Update the `from` email in `supabase/functions/weekly-digest/index.ts`

## 6. Deploy Edge Functions

### Install Supabase CLI

```bash
npm install -g supabase
```

### Link Project

```bash
supabase login
supabase link --project-ref your-project-ref
```

### Set Secrets

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_PRICE_ID=price_...
supabase secrets set RESEND_API_KEY=re_...
```

### Deploy Functions

```bash
supabase functions deploy snip
supabase functions deploy summary
supabase functions deploy chat
supabase functions deploy stripe-webhook
supabase functions deploy weekly-digest
```

## 7. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## 8. Set Up Weekly Digest Cron (Optional)

To send weekly digest emails automatically:

1. Go to Supabase Dashboard > Database > Extensions
2. Enable `pg_cron`
3. Go to SQL Editor and run:

```sql
-- Schedule weekly digest for Sundays at 9am UTC
SELECT cron.schedule(
  'weekly-digest',
  '0 9 * * 0',
  $$
  SELECT
    net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/weekly-digest',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

Replace `YOUR_SERVICE_ROLE_KEY` with your Supabase service role key (found in Project Settings > API).

## 9. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Verification Checklist

1. **Auth**: Sign up → receive confirmation → sign in → see library
2. **Add Video**: Paste YouTube URL → video appears with thumbnail + title
3. **Snip**: Watch video → click SNIP → snip appears with AI-generated content
4. **Summary**: New video → Summary tab shows "Generating..." → shows content
5. **Chat**: Ask question → get relevant answer from transcript
6. **Subscription**: Trial expires → paywall appears → subscribe → access restored
7. **Weekly Email**: Trigger manually → receive digest with videos, snips, archive snip

## Troubleshooting

### "ANTHROPIC_API_KEY not configured"

Make sure you've set the secret in Supabase:
```bash
supabase secrets set ANTHROPIC_API_KEY=your-key
```

### Transcript not loading

Some videos don't have captions. The app will show "No transcript available" for these videos.

### Stripe checkout not working

1. Verify your Stripe publishable key is correct
2. Check that the price ID is set in Supabase secrets
3. Ensure the webhook is configured correctly

### Google OAuth not redirecting

1. Check that the redirect URL in Google Console matches your Supabase URL
2. Verify the client ID and secret are correct in Supabase Auth settings

## Production Deployment

For production, deploy to Vercel, Netlify, or any static hosting:

```bash
npm run build
```

The `dist` folder contains your production build.

Remember to:
- Use production Stripe keys (not test keys)
- Set up proper CORS for your domain
- Configure authentication redirect URLs for your production domain
