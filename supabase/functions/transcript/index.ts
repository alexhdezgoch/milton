// v2 - Fixed Supadata API response handling
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TranscriptSegment {
  start: number
  text: string
}

interface CaptionTrack {
  baseUrl: string
  languageCode?: string
  kind?: string
}

interface SupadataSegment {
  text: string
  offset: number
  duration: number
}

interface SupadataResponse {
  content: SupadataSegment[]
  lang: string
}

// Helper function to decode hex escape sequences (\x22 -> ")
function decodeHexEscapes(str: string): string {
  return str.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  )
}

// Helper function to extract caption tracks using multiple strategies
function extractCaptionTracks(html: string): CaptionTrack[] | null {
  // Strategy 1: Standard regex pattern
  try {
    const match = html.match(/"captionTracks":\s*(\[.*?\])/)
    if (match) {
      let jsonStr = match[1]
      jsonStr = decodeHexEscapes(jsonStr)
      jsonStr = jsonStr.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
      const tracks = JSON.parse(jsonStr)
      if (tracks && tracks.length > 0) {
        return tracks
      }
    }
  } catch (e) {
    console.log('Strategy 1 failed:', e)
  }

  // Strategy 2: Parse full ytInitialPlayerResponse JSON
  try {
    const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/)
    if (playerResponseMatch) {
      let jsonStr = playerResponseMatch[1]
      jsonStr = decodeHexEscapes(jsonStr)
      const playerResponse = JSON.parse(jsonStr)
      const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks
      if (tracks && tracks.length > 0) {
        return tracks
      }
    }
  } catch (e) {
    console.log('Strategy 2 failed:', e)
  }

  // Strategy 3: Look for captionTracks in a broader context
  try {
    const altMatch = html.match(/\{"captionTracks":(.*?),"audioTracks"/)
    if (altMatch) {
      let jsonStr = altMatch[1]
      jsonStr = decodeHexEscapes(jsonStr)
      const tracks = JSON.parse(jsonStr)
      if (tracks && tracks.length > 0) {
        return tracks
      }
    }
  } catch (e) {
    console.log('Strategy 3 failed:', e)
  }

  // Strategy 4: Match captionTracks with more flexible ending
  try {
    const flexMatch = html.match(/"captionTracks":\s*(\[[\s\S]*?\])(?=\s*,\s*"[a-zA-Z])/)
    if (flexMatch) {
      let jsonStr = flexMatch[1]
      jsonStr = decodeHexEscapes(jsonStr)
      jsonStr = jsonStr.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
      const tracks = JSON.parse(jsonStr)
      if (tracks && tracks.length > 0) {
        return tracks
      }
    }
  } catch (e) {
    console.log('Strategy 4 failed:', e)
  }

  return null
}

// Fetch transcript via Supadata API (handles YouTube bot detection)
async function fetchViaSupadata(videoId: string): Promise<{ segments: TranscriptSegment[], rawText: string } | null> {
  const apiKey = Deno.env.get('SUPADATA_API_KEY')
  console.log('SUPADATA_API_KEY present:', !!apiKey, 'length:', apiKey?.length || 0)
  if (!apiKey) {
    console.log('SUPADATA_API_KEY not configured, skipping Supadata')
    return null
  }
  console.log('Using Supadata API with key starting:', apiKey.substring(0, 8))

  try {
    const response = await fetch(
      `https://api.supadata.ai/v1/youtube/transcript?url=https://youtube.com/watch?v=${videoId}`,
      {
        headers: {
          'x-api-key': apiKey,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.log(`Supadata API error (${response.status}): ${errorText}`)
      return null
    }

    const data = await response.json()
    console.log('Supadata response keys:', Object.keys(data))
    console.log('Supadata content type:', typeof data.content, Array.isArray(data.content))

    if (!data.content || data.content.length === 0) {
      return null
    }

    // Transform Supadata format to our format
    const segments: TranscriptSegment[] = data.content.map((item) => ({
      start: Math.floor(item.offset / 1000), // Convert ms to seconds
      text: item.text.trim(),
    })).filter(s => s.text)

    const rawText = segments.map(s => s.text).join(' ')

    return { segments, rawText }
  } catch (error) {
    console.log('Supadata fetch error:', error)
    return null
  }
}

// Custom error class for categorized errors
class TranscriptError extends Error {
  code: string
  httpStatus: number

  constructor(message: string, code: string, httpStatus: number) {
    super(message)
    this.code = code
    this.httpStatus = httpStatus
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let videoId: string
    try {
      const body = await req.json()
      videoId = body.videoId
    } catch {
      throw new TranscriptError('Invalid request body', 'INVALID_REQUEST', 400)
    }

    if (!videoId) {
      throw new TranscriptError('No videoId provided', 'MISSING_VIDEO_ID', 400)
    }

    // Strategy 1: Try Supadata API first (handles YouTube bot detection)
    const supadataResult = await fetchViaSupadata(videoId)
    if (supadataResult) {
      console.log('Successfully fetched transcript via Supadata')
      return new Response(JSON.stringify({
        segments: supadataResult.segments,
        rawText: supadataResult.rawText,
        noCaptions: false,
        error: null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Strategy 2: Fall back to direct YouTube fetch
    // This may work for some videos depending on IP reputation
    console.log('Supadata unavailable, falling back to direct fetch')
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`

    const pageResponse = await fetch(watchUrl, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Cookie': 'CONSENT=PENDING+987; SOCS=CAESEwgDEgk1ODE5MjkyNDQaAmVuIAEaBgiA_LyaBg',
      },
    })

    if (!pageResponse.ok) {
      if (pageResponse.status === 404) {
        throw new TranscriptError('Video not found', 'VIDEO_NOT_FOUND', 404)
      }
      throw new TranscriptError(`Failed to fetch video page: ${pageResponse.status}`, 'FETCH_ERROR', 500)
    }

    const html = await pageResponse.text()

    // Check video playability status
    if (html.includes('"playabilityStatus"')) {
      const statusMatch = html.match(/"status":\s*"([^"]+)"/)
      if (statusMatch && statusMatch[1] !== 'OK') {
        const status = statusMatch[1]
        if (status === 'LOGIN_REQUIRED') {
          throw new TranscriptError('Video requires login or is private', 'VIDEO_PRIVATE', 403)
        } else if (status === 'UNPLAYABLE') {
          // Check for geo-blocking
          const reasonMatch = html.match(/"reason":\s*"([^"]+)"/)
          const reason = reasonMatch ? reasonMatch[1] : 'Video unavailable'
          throw new TranscriptError(reason, 'VIDEO_UNAVAILABLE', 403)
        } else if (status === 'ERROR') {
          throw new TranscriptError('Video not found', 'VIDEO_NOT_FOUND', 404)
        }
      }
    }

    // Extract captions using multiple strategies
    const captionTracks = extractCaptionTracks(html)

    if (!captionTracks || captionTracks.length === 0) {
      // This is NOT an error - video exists but has no captions
      return new Response(JSON.stringify({
        segments: [],
        rawText: '',
        noCaptions: true,
        error: null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Select best caption track (prefer manual over auto-generated)
    let selectedTrack = captionTracks.find((track: CaptionTrack) =>
      track.kind !== 'asr' && track.languageCode?.startsWith('en')
    ) || captionTracks.find((track: CaptionTrack) =>
      track.kind !== 'asr'
    ) || captionTracks.find((track: CaptionTrack) =>
      track.languageCode?.startsWith('en')
    ) || captionTracks[0]

    let captionUrl = selectedTrack.baseUrl
    if (!captionUrl) {
      throw new TranscriptError('No caption URL found in track', 'PARSE_ERROR', 500)
    }

    // Ensure we get XML format
    if (!captionUrl.includes('fmt=')) {
      captionUrl += '&fmt=srv3'
    }

    // Fetch transcript
    const transcriptResponse = await fetch(captionUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      }
    })

    if (!transcriptResponse.ok) {
      throw new TranscriptError(`Failed to fetch transcript: ${transcriptResponse.status}`, 'TRANSCRIPT_FETCH_ERROR', 500)
    }

    const transcriptXml = await transcriptResponse.text()

    // Parse XML segments
    const segments: TranscriptSegment[] = []
    const textRegex = /<text start="([^"]+)"[^>]*>([^<]*)<\/text>/g
    let match

    while ((match = textRegex.exec(transcriptXml)) !== null) {
      const start = parseFloat(match[1])
      let text = match[2]

      // Decode HTML entities
      text = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/\n/g, ' ')
        .trim()

      if (text) {
        segments.push({ start: Math.floor(start), text })
      }
    }

    const rawText = segments.map(s => s.text).join(' ')

    return new Response(JSON.stringify({
      segments,
      rawText,
      noCaptions: false,
      error: null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Transcript fetch error:', error)

    // Always return 200 with error in body so Supabase client passes through details
    // (non-2xx causes Supabase to throw generic error, losing the actual message)
    if (error instanceof TranscriptError) {
      return new Response(JSON.stringify({
        segments: [],
        rawText: '',
        error: error.message,
        errorCode: error.code
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Handle unexpected errors
    return new Response(JSON.stringify({
      segments: [],
      rawText: '',
      error: error.message || 'Failed to fetch transcript',
      errorCode: 'INTERNAL_ERROR'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
