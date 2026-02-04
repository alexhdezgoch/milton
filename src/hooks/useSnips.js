import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import * as api from '../services/api'
import * as claude from '../services/claude'
import { getTranscriptContext, formatDuration } from '../services/youtube'

export function useSnips(videoId = null) {
  const { user, refreshKey } = useAuth()
  const [snips, setSnips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [generatingSnipAt, setGeneratingSnipAt] = useState(null) // timestamp in seconds when generating

  const fetchSnips = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = videoId
        ? await api.getSnipsForVideo(videoId)
        : await api.getSnips(user.id)
      setSnips(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, videoId, refreshKey])

  useEffect(() => {
    fetchSnips()
  }, [fetchSnips])

  const createSnip = async (video, timestampSeconds) => {
    if (!user) throw new Error('Not authenticated')
    if (!video?.transcript) throw new Error('No transcript available')

    // Calculate context window: 30s before, 15s after (45s total)
    const startSeconds = Math.max(0, timestampSeconds - 30)
    const endSeconds = timestampSeconds + 15

    // Get context around timestamp with extended window
    const context = getTranscriptContext(video.transcript, timestampSeconds, 45)
    if (!context) throw new Error('No transcript content at this timestamp')

    // Set generating state with timestamp
    setGeneratingSnipAt(timestampSeconds)
    setError(null)

    try {
      // Generate snip with AI
      const result = await claude.generateSnip(
        context,
        timestampSeconds,
        video.title,
        startSeconds,
        endSeconds
      )

      // Create snip in database
      const snipData = {
        video_id: video.id,
        title: result.title,
        timestamp_seconds: timestampSeconds,
        timestamp_formatted: formatDuration(timestampSeconds),
        bullets: result.bullets,
        ai_generated: true
      }

      const newSnip = await api.createSnip(user.id, snipData)
      setSnips(prev => [...prev, newSnip].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds))

      return newSnip
    } catch (err) {
      setError(err.message || 'Failed to create snip')
      throw err
    } finally {
      setGeneratingSnipAt(null)
    }
  }

  const createManualSnip = async (videoId, title, timestampSeconds, bullets = []) => {
    if (!user) throw new Error('Not authenticated')

    const snipData = {
      video_id: videoId,
      title,
      timestamp_seconds: timestampSeconds,
      timestamp_formatted: formatDuration(timestampSeconds),
      bullets,
      ai_generated: false
    }

    const newSnip = await api.createSnip(user.id, snipData)
    setSnips(prev => [...prev, newSnip].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds))

    return newSnip
  }

  const updateSnip = async (snipId, updates) => {
    const updated = await api.updateSnip(snipId, updates)
    setSnips(prev => prev.map(s => s.id === snipId ? { ...s, ...updated } : s))
    return updated
  }

  const deleteSnip = async (snipId) => {
    await api.deleteSnip(snipId)
    setSnips(prev => prev.filter(s => s.id !== snipId))
  }

  const toggleStar = async (snipId) => {
    const snip = snips.find(s => s.id === snipId)
    if (!snip) return

    const updated = await api.toggleSnipStar(snipId, !snip.starred)
    setSnips(prev => prev.map(s => s.id === snipId ? { ...s, starred: !s.starred } : s))
    return updated
  }

  // Rewrite a snip with a different style
  const rewriteSnip = async (snipId, style, video) => {
    const snip = snips.find(s => s.id === snipId)
    if (!snip) return
    if (!video?.transcript) {
      setError('No transcript available. Transcript is required to rewrite snips.')
      return
    }

    const context = getTranscriptContext(video.transcript, snip.timestamp_seconds, 45)

    try {
      const result = await claude.enhanceSnip(
        snipId,
        'rewrite',
        context,
        { title: snip.title, bullets: snip.bullets, quote: snip.quote, speaker: snip.speaker },
        style
      )

      const updated = await api.updateSnip(snipId, {
        title: result.title,
        bullets: result.bullets,
        quote: result.quote || snip.quote
      })

      setSnips(prev => prev.map(s => s.id === snipId ? { ...s, ...updated } : s))
      return updated
    } catch (err) {
      setError(err.message || 'Failed to rewrite snip')
      throw err
    }
  }

  // Expand a snip into a longer summary
  const expandSnip = async (snipId, video) => {
    const snip = snips.find(s => s.id === snipId)
    if (!snip) return
    if (!video?.transcript) {
      setError('No transcript available. Transcript is required to expand snips.')
      return
    }

    const context = getTranscriptContext(video.transcript, snip.timestamp_seconds, 60)

    try {
      const result = await claude.enhanceSnip(
        snipId,
        'expand',
        context,
        { title: snip.title, bullets: snip.bullets, quote: snip.quote, speaker: snip.speaker }
      )

      const updated = await api.updateSnip(snipId, {
        title: result.title,
        bullets: result.bullets,
        expanded_summary: result.expanded
      })

      setSnips(prev => prev.map(s => s.id === snipId ? { ...s, ...updated } : s))
      return updated
    } catch (err) {
      setError(err.message || 'Failed to expand snip')
      throw err
    }
  }

  const clearError = () => setError(null)

  return {
    snips,
    loading,
    error,
    generatingSnipAt,
    fetchSnips,
    createSnip,
    createManualSnip,
    updateSnip,
    deleteSnip,
    toggleStar,
    rewriteSnip,
    expandSnip,
    clearError
  }
}
