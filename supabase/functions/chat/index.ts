import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transcript, history, message, videoTitle, snips } = await req.json()

    if (!message) {
      throw new Error('No message provided')
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    // Truncate transcript if too long
    const maxChars = 25000
    const truncatedTranscript = transcript?.length > maxChars
      ? transcript.slice(0, maxChars) + '...[truncated]'
      : transcript || 'No transcript available'

    // Format snips context if provided
    let snipsContext = ''
    if (snips && snips.length > 0) {
      snipsContext = `\n\nUser's saved snips from this video:
${snips.map((s: { timestamp_formatted: string; title: string; bullets?: string[] }) =>
  `- [${s.timestamp_formatted}] ${s.title}${s.bullets ? ': ' + s.bullets.join('; ') : ''}`
).join('\n')}`
    }

    const systemPrompt = `You are a helpful assistant that answers questions about a specific YouTube video.
You have access to the video's transcript and should use it to provide accurate, specific answers.

Video: "${videoTitle}"

Transcript:
"""
${truncatedTranscript}
"""
${snipsContext}

IMPORTANT Guidelines:
- Answer ONLY from video content. Do not use external knowledge.
- Reference timestamps as [MM:SS] format when mentioning specific moments.
- If the information is not in the video transcript, say "I don't see that mentioned in this video."
- Quote relevant parts of the transcript when helpful.
- Be concise but thorough.
- If the user has saved snips related to their question, reference those insights.
- Format your response with clear paragraphs using line breaks for readability.`

    // Build messages array with history
    const messages = [
      ...(history || []).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${error}`)
    }

    const data = await response.json()
    const content = data.content[0].text

    return new Response(JSON.stringify({ response: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Chat error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
