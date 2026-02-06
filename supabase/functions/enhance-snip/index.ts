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

type EnhanceAction = 'rewrite' | 'expand'
type RewriteStyle = 'actionable' | 'concise' | 'memorable'

interface EnhanceRequest {
  snipId: string
  action: EnhanceAction
  style?: RewriteStyle
  context: string
  currentSnip: {
    title: string
    bullets: string[]
    quote?: string
    speaker?: string
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, style, context, currentSnip }: EnhanceRequest = await req.json()

    if (!action || !context || !currentSnip) {
      throw new Error('Missing required fields: action, context, and currentSnip')
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    let systemPrompt: string
    let userPrompt: string

    if (action === 'expand') {
      systemPrompt = `You are an expert at creating comprehensive summaries from video content.
Your task is to expand a brief "snip" note into a more detailed summary while maintaining accuracy.`

      userPrompt = `Original snip:
Title: ${currentSnip.title}
Bullets: ${currentSnip.bullets.join('; ')}
${currentSnip.quote ? `Quote: "${currentSnip.quote}"` : ''}

Transcript context:
"""
${context}
"""

Expand this snip into a more comprehensive summary. Return as JSON:
{
  "title": "Enhanced descriptive title",
  "bullets": ["Expanded first point with more detail", "Expanded second point", "Expanded third point"],
  "expanded": "2-3 paragraph detailed summary of this section"
}`

    } else {
      // Rewrite with style
      const styleInstructions = {
        actionable: 'Make it action-oriented with clear steps the viewer can take. Use imperative verbs.',
        concise: 'Make it extremely concise and direct. Cut all unnecessary words. Focus on the single most important point.',
        memorable: 'Make it memorable and quotable. Use vivid language, analogies, or frameworks that stick.'
      }

      const instruction = styleInstructions[style || 'actionable']

      systemPrompt = `You are an expert at rewriting notes to be more effective.
Your task is to rewrite a "snip" note with a specific style while preserving the core insight.

Style instruction: ${instruction}`

      userPrompt = `Original snip:
Title: ${currentSnip.title}
Bullets: ${currentSnip.bullets.join('; ')}
${currentSnip.quote ? `Quote: "${currentSnip.quote}"` : ''}

Transcript context for reference:
"""
${context}
"""

Rewrite this snip in the ${style || 'actionable'} style. Return as JSON:
{
  "title": "Rewritten title (max 6 words)",
  "bullets": ["Rewritten first point", "Rewritten second point"],
  "quote": "Most impactful quote from transcript (optional)"
}`
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
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
    const enhanced = extractJSON(content)

    return new Response(JSON.stringify(enhanced), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Enhance snip error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
