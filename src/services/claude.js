import { supabase } from '../lib/supabase'

// Generate a snip from transcript context
export async function generateSnip(context, timestamp, videoTitle, startSeconds = null, endSeconds = null) {
  const { data, error } = await supabase.functions.invoke('snip', {
    body: {
      context,
      timestamp,
      videoTitle,
      startSeconds,
      endSeconds
    }
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

// Generate a summary from full transcript
export async function generateSummary(transcriptRaw, videoTitle) {
  const { data, error } = await supabase.functions.invoke('summary', {
    body: {
      transcript: transcriptRaw,
      videoTitle
    }
  })

  // Surface the actual error message from the edge function
  if (error) {
    const message = data?.error || error.message || 'Failed to generate summary'
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

// Chat with video content
export async function chatWithVideo(transcriptRaw, history, message, videoTitle, snips = []) {
  const { data, error } = await supabase.functions.invoke('chat', {
    body: {
      transcript: transcriptRaw,
      history,
      message,
      videoTitle,
      snips
    }
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

// Enhance a snip (rewrite or expand)
export async function enhanceSnip(snipId, action, context, currentSnip, style = null) {
  const { data, error } = await supabase.functions.invoke('enhance-snip', {
    body: {
      snipId,
      action,
      style,
      context,
      currentSnip
    }
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}
