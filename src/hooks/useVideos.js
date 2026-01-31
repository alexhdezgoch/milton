import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import * as api from '../services/api'
import * as youtube from '../services/youtube'
import { generateSummary } from '../services/claude'

export function useVideos() {
  const { user } = useAuth()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchVideos = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await api.getVideos(user.id)
      setVideos(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  const addVideo = async (youtubeUrl) => {
    if (!user) throw new Error('Not authenticated')

    const videoId = youtube.extractVideoId(youtubeUrl)
    if (!videoId) throw new Error('Invalid YouTube URL')

    // Check if video already exists
    const existing = videos.find(v => v.youtube_id === videoId)
    if (existing) throw new Error('Video already in library')

    // Fetch metadata and transcript in parallel
    const [metadata, transcriptData] = await Promise.all([
      youtube.fetchVideoMetadata(videoId),
      youtube.fetchTranscript(videoId)
    ])

    // Log transcript fetch results for debugging
    if (transcriptData.error) {
      console.error('Transcript fetch failed:', transcriptData.error, transcriptData.errorCode)
      console.log('Video will be created without transcript')
    } else if (transcriptData.noCaptions) {
      console.log('Video has no captions available')
    } else if (transcriptData.segments?.length > 0) {
      console.log(`Transcript fetched: ${transcriptData.segments.length} segments, ${transcriptData.rawText?.length || 0} chars`)
    } else {
      console.warn('Transcript fetch returned empty data')
    }

    // Create video in database
    const videoData = {
      youtube_id: videoId,
      youtube_url: youtube.buildYouTubeUrl(videoId),
      title: metadata.title,
      author: metadata.author,
      thumbnail_url: metadata.thumbnailUrl,
      transcript: transcriptData.segments,
      transcript_raw: transcriptData.rawText
    }

    const newVideo = await api.createVideo(user.id, videoData)

    // Create pending summary
    await api.createSummary(newVideo.id, { status: 'pending' })

    // Start summary generation in background
    generateSummaryInBackground(newVideo.id, transcriptData.rawText, metadata.title)

    // Update local state
    setVideos(prev => [{ ...newVideo, snipsCount: 0, tags: [] }, ...prev])

    // Return video with transcript info
    const result = { ...newVideo }
    if (transcriptData.error) {
      result.transcriptWarning = transcriptData.error
      result.transcriptErrorCode = transcriptData.errorCode
    } else if (transcriptData.noCaptions) {
      result.noCaptions = true
    }
    return result
  }

  const retryTranscript = async (videoId, youtubeId) => {
    const transcriptData = await youtube.fetchTranscript(youtubeId)

    if (transcriptData.error) {
      throw new Error(transcriptData.error)
    }

    if (transcriptData.noCaptions) {
      return { noCaptions: true, segments: [], rawText: '' }
    }

    // Update video with new transcript
    await api.updateVideoTranscript(videoId, transcriptData.segments, transcriptData.rawText)

    // Update local state
    setVideos(prev => prev.map(v =>
      v.id === videoId
        ? { ...v, transcript: transcriptData.segments, transcript_raw: transcriptData.rawText }
        : v
    ))

    return transcriptData
  }

  const generateSummaryInBackground = async (videoId, transcript, title) => {
    try {
      await api.updateSummary(videoId, { status: 'generating' })
      const summary = await generateSummary(transcript, title)
      await api.updateSummary(videoId, {
        main_point: summary.overview || summary.mainPoint,
        key_takeaways: summary.takeaways || summary.keyTakeaways,
        status: 'completed'
      })
    } catch (err) {
      console.error('Failed to generate summary:', err)
      await api.updateSummary(videoId, { status: 'failed' })
    }
  }

  const updateVideo = async (videoId, updates) => {
    const updated = await api.updateVideo(videoId, updates)
    setVideos(prev => prev.map(v => v.id === videoId ? { ...v, ...updated } : v))
    return updated
  }

  const deleteVideo = async (videoId) => {
    await api.deleteVideo(videoId)
    setVideos(prev => prev.filter(v => v.id !== videoId))
  }

  const getVideo = async (videoId) => {
    return api.getVideo(videoId)
  }

  return {
    videos,
    loading,
    error,
    fetchVideos,
    addVideo,
    updateVideo,
    deleteVideo,
    getVideo,
    retryTranscript
  }
}

export function useVideo(videoId) {
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!videoId) {
      setVideo(null)
      setLoading(false)
      return
    }

    const fetchVideo = async () => {
      try {
        setLoading(true)
        const data = await api.getVideo(videoId)
        setVideo(data)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchVideo()
  }, [videoId])

  const updateVideo = async (updates) => {
    if (!video) return
    const updated = await api.updateVideo(video.id, updates)
    setVideo(prev => ({ ...prev, ...updated }))
    return updated
  }

  const refreshVideo = async () => {
    if (!videoId) return
    const data = await api.getVideo(videoId)
    setVideo(data)
  }

  const retryTranscript = async () => {
    if (!video) return

    const transcriptData = await youtube.fetchTranscript(video.youtube_id)

    if (transcriptData.error) {
      throw new Error(transcriptData.error)
    }

    if (transcriptData.noCaptions) {
      return { noCaptions: true, segments: [], rawText: '' }
    }

    // Update video with new transcript
    const updated = await api.updateVideoTranscript(video.id, transcriptData.segments, transcriptData.rawText)

    // Update local state
    setVideo(prev => ({
      ...prev,
      transcript: transcriptData.segments,
      transcript_raw: transcriptData.rawText
    }))

    return transcriptData
  }

  return {
    video,
    loading,
    error,
    updateVideo,
    refreshVideo,
    retryTranscript
  }
}

export function useStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalVideos: 0,
    inProgress: 0,
    completed: 0,
    totalSnips: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      try {
        const data = await api.getStats(user.id)
        setStats(data)
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  return { stats, loading }
}
