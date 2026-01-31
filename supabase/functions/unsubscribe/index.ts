import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle both GET (from email link) and POST requests
  const url = new URL(req.url)
  const userId = url.searchParams.get('user_id')

  if (!userId) {
    return new Response(renderHtml('Error', 'Invalid unsubscribe link.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' }
    })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Update user's email preferences
    const { error } = await supabase
      .from('profiles')
      .update({ weekly_digest_enabled: false })
      .eq('id', userId)

    if (error) throw error

    return new Response(
      renderHtml(
        'Unsubscribed',
        'You have been successfully unsubscribed from Milton weekly digest emails. You can re-enable them anytime in your account settings.'
      ),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return new Response(
      renderHtml('Error', 'Something went wrong. Please try again or contact support.'),
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }
})

function renderHtml(title: string, message: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Milton</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #F3F4F6;
      margin: 0;
      padding: 40px 20px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 48px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
    }
    .logo-icon {
      width: 40px;
      height: 40px;
      background: #111827;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
    }
    .logo-text {
      font-family: Georgia, serif;
      font-size: 24px;
      font-weight: 600;
      color: #111827;
    }
    h1 {
      font-size: 24px;
      color: #111827;
      margin: 0 0 16px;
    }
    p {
      color: #6B7280;
      line-height: 1.6;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <div class="logo-icon">✂</div>
      <span class="logo-text">Milton</span>
    </div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>
  `
}
