import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Extract JSON from AI response - handles markdown code blocks and extra text
function extractJSON(content: string): object {
  let jsonStr = content

  // Remove markdown code fences if present
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim()
  }

  // Try to parse directly first (cleanest case)
  try {
    return JSON.parse(jsonStr)
  } catch {
    // Fall back to regex extraction
  }

  // Find JSON object with non-greedy match for trailing content
  const jsonMatch = jsonStr.match(/\{[\s\S]*?\}(?=\s*$)/) || jsonStr.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response - no JSON found')
  }

  return JSON.parse(jsonMatch[0])
}

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
    const { context, timestamp, videoTitle, startSeconds, endSeconds } = await req.json()

    if (!context) {
      throw new Error('No context provided')
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const systemPrompt = `You are an expert at creating concise, insightful notes from video content.
Your task is to create a "snip" - a brief note capturing the key insight or concept from a specific moment in a video.

A snip consists of:
1. A short, descriptive title (max 6 words) that captures the main idea
2. 2-3 bullet points (max 15 words each) that expand on the key points
3. A memorable quote - the exact words from the transcript that best represent this insight. You MUST always include a quote. Pick the most impactful sentence or phrase spoken in the transcript excerpt.
4. The speaker's name if identifiable from the transcript

Be specific and actionable. Avoid vague summaries. Focus on what makes this moment valuable to revisit.
The quote field is required — never omit it. Always select a direct quote from the transcript.`

    const userPrompt = `Video: "${videoTitle}"
Timestamp: ${formatTimestamp(timestamp)}
Context window: ${formatTimestamp(startSeconds || timestamp - 30)} to ${formatTimestamp(endSeconds || timestamp + 15)}

Transcript excerpt around this moment:
"""
${context}
"""

Create a snip for this moment. Return your response as JSON with this exact format:
{
  "title": "Brief 6 word max title",
  "bullets": ["First key point (15 words max)", "Second key point", "Third key point optional"],
  "quote": "Exact memorable words from the transcript above",
  "speaker": "Speaker name if identifiable, or null"
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${error}`)
    }

    const data = await response.json()
    const content = data.content[0].text

    // Parse JSON from response
    const snip = extractJSON(content) as { title?: string; bullets?: string[]; quote?: string; speaker?: string }

    // Fallback: extract a quote from the context if AI didn't provide one
    let quote = snip.quote || null
    if (!quote && context) {
      // Pick the longest sentence from the transcript as a fallback quote
      const sentences = context.split(/[.!?]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 20)
      if (sentences.length > 0) {
        quote = sentences.reduce((a: string, b: string) => a.length > b.length ? a : b)
      }
    }

    // Ensure all fields are present
    const result = {
      title: snip.title || 'Untitled snip',
      bullets: snip.bullets || [],
      quote,
      speaker: snip.speaker || null
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Snip generation error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function formatTimestamp(seconds: number): string {
  if (seconds == null || isNaN(seconds)) return '0:00'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
