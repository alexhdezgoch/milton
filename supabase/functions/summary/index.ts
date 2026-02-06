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
    const { transcript, videoTitle } = await req.json()

    if (!transcript) {
      throw new Error('No transcript provided')
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    // Truncate transcript if too long (keeping under token limits)
    const maxChars = 30000
    const truncatedTranscript = transcript.length > maxChars
      ? transcript.slice(0, maxChars) + '...[truncated]'
      : transcript

    const systemPrompt = `You are an expert at distilling video content into clear, actionable summaries.
Your summaries help users quickly understand and remember the key value of a video.

Focus on:
- The core message or argument
- Main topics covered
- Actionable insights and takeaways
- Key concepts that are worth revisiting`

    const userPrompt = `Video: "${videoTitle}"

Full transcript:
"""
${truncatedTranscript}
"""

Create a comprehensive summary with:
1. An "overview" - 3-4 sentence paragraph capturing the essential content and value
2. "topics" - 4-6 main topics or themes covered in the video (short labels)
3. "takeaways" - 3-5 specific, actionable insights from the video

Return your response as JSON with this exact format:
{
  "overview": "3-4 sentence paragraph summarizing the video content and its value",
  "topics": ["Topic One", "Topic Two", "Topic Three", "Topic Four"],
  "takeaways": ["First actionable insight", "Second insight", "Third insight", "Fourth insight"]
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
        max_tokens: 1000,
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
    const summary = extractJSON(content) as { overview?: string; topics?: string[]; takeaways?: string[] }

    // Ensure all fields are present and properly formatted
    const result = {
      overview: summary.overview || '',
      topics: summary.topics || [],
      takeaways: summary.takeaways || [],
      // Legacy field support for backwards compatibility
      mainPoint: summary.overview ? summary.overview.split('.')[0] + '.' : '',
      keyTakeaways: summary.takeaways || []
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Summary generation error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
