import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import * as api from '../services/api'

export function useTags() {
  const { user } = useAuth()
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTags = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await api.getTags(user.id)
      setTags(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const createTag = async (name, color) => {
    if (!user) throw new Error('Not authenticated')

    const newTag = await api.createTag(user.id, name, color)
    setTags(prev => [...prev, { ...newTag, count: 0 }].sort((a, b) => a.name.localeCompare(b.name)))
    return newTag
  }

  const updateTag = async (tagId, updates) => {
    const updated = await api.updateTag(tagId, updates)
    setTags(prev => prev.map(t => t.id === tagId ? { ...t, ...updated } : t))
    return updated
  }

  const deleteTag = async (tagId) => {
    await api.deleteTag(tagId)
    setTags(prev => prev.filter(t => t.id !== tagId))
  }

  const addTagToVideo = async (videoId, tagId) => {
    await api.addTagToVideo(videoId, tagId)
    setTags(prev => prev.map(t =>
      t.id === tagId ? { ...t, count: (t.count || 0) + 1 } : t
    ))
  }

  const removeTagFromVideo = async (videoId, tagId) => {
    await api.removeTagFromVideo(videoId, tagId)
    setTags(prev => prev.map(t =>
      t.id === tagId ? { ...t, count: Math.max(0, (t.count || 1) - 1) } : t
    ))
  }

  const getVideosForTag = async (tagId) => {
    return api.getVideosForTag(tagId)
  }

  return {
    tags,
    loading,
    error,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    addTagToVideo,
    removeTagFromVideo,
    getVideosForTag
  }
}
