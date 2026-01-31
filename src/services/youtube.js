import { supabase } from '../lib/supabase'

// Error codes that should not be retried (permanent failures)
const NON_RETRYABLE_ERRORS = [
  'MISSING_VIDEO_ID',
  'INVALID_REQUEST',
  'VIDEO_NOT_FOUND',
  'VIDEO_PRIVATE',
  'VIDEO_UNAVAILABLE'
]

// Check if an error is retryable
function isRetryableError(errorCode) {
  return !NON_RETRYABLE_ERRORS.includes(errorCode)
}

// Helper for exponential backoff retry
async function withRetry(fn, { maxAttempts = 3, baseDelayMs = 1000 } = {}) {
  let lastError
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn()
      // Check if result indicates a retryable error
      if (result.error && result.errorCode && !isRetryableError(result.errorCode)) {
        return result // Don't retry permanent failures
      }
      if (!result.error) {
        return result // Success
      }
      lastError = result
    } catch (err) {
      lastError = { error: err.message, errorCode: 'NETWORK_ERROR' }
    }

    // Don't delay after the last attempt
    if (attempt < maxAttempts) {
      const delay = baseDelayMs * Math.pow(2, attempt - 1) // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay))
      console.log(`Retry attempt ${attempt + 1}/${maxAttempts} after ${delay}ms`)
    }
  }
  return lastError
}

// Extract video ID from various YouTube URL formats
export function extractVideoId(url) {
  if (!url) return null

  const patterns = [
    // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // Shortened URL: https://youtu.be/VIDEO_ID
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // Embed URL: https://www.youtube.com/embed/VIDEO_ID
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    // Mobile URL: https://m.youtube.com/watch?v=VIDEO_ID
    /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // Just the video ID
    /^([a-zA-Z0-9_-]{11})$/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

// Fetch transcript from YouTube via Edge Function
export async function fetchTranscript(videoId, { maxAttempts = 3 } = {}) {
  const fetchOnce = async () => {
    const { data, error } = await supabase.functions.invoke('transcript', {
      body: { videoId }
    })

    // Handle invoke-level errors (network failures, etc.)
    if (error) {
      console.error('Error invoking transcript function:', error)
      return {
        segments: [],
        rawText: '',
        error: error.message || 'Failed to fetch transcript',
        errorCode: 'INVOKE_ERROR'
      }
    }

    // Handle application-level errors from the edge function
    if (data.error) {
      console.error('Transcript error:', data.error, 'Code:', data.errorCode)
      return {
        segments: [],
        rawText: '',
        error: data.error,
        errorCode: data.errorCode || 'UNKNOWN_ERROR'
      }
    }

    // Handle "no captions" case - this is not an error
    if (data.noCaptions) {
      return {
        segments: [],
        rawText: '',
        noCaptions: true,
        error: null
      }
    }

    // Success
    return {
      segments: data.segments || [],
      rawText: data.rawText || '',
      noCaptions: false,
      error: null
    }
  }

  // Use retry logic for retryable errors
  return withRetry(fetchOnce, { maxAttempts })
}

// Fetch video metadata using oEmbed (no API key needed)
export async function fetchVideoMetadata(videoId) {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    const response = await fetch(oembedUrl)

    if (!response.ok) {
      throw new Error('Failed to fetch video metadata')
    }

    const data = await response.json()

    return {
      title: data.title,
      author: data.author_name,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      error: null
    }
  } catch (error) {
    console.error('Error fetching video metadata:', error)
    return {
      title: 'Unknown Title',
      author: 'Unknown Author',
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      error: error.message
    }
  }
}

// Get transcript context around a timestamp (for snip generation)
export function getTranscriptContext(segments, timestampSeconds, windowSeconds = 30) {
  if (!segments || segments.length === 0) return ''

  const startTime = Math.max(0, timestampSeconds - windowSeconds)
  const endTime = timestampSeconds + windowSeconds

  const relevantSegments = segments.filter(
    segment => segment.start >= startTime && segment.start <= endTime
  )

  return relevantSegments.map(s => s.text).join(' ')
}

// Format seconds to MM:SS or HH:MM:SS
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0:00'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// Parse duration string to seconds
export function parseDuration(durationStr) {
  if (!durationStr) return 0

  const parts = durationStr.split(':').map(Number)
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  return parts[0] || 0
}

// Build YouTube URL from video ID
export function buildYouTubeUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`
}

// Build YouTube URL with timestamp
export function buildYouTubeUrlWithTimestamp(videoId, timestampSeconds) {
  return `https://www.youtube.com/watch?v=${videoId}&t=${timestampSeconds}`
}
