import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import * as api from '../services/api'
import * as claude from '../services/claude'

export function useChat(videoId) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [lastFailedMessage, setLastFailedMessage] = useState(null)

  const fetchMessages = useCallback(async () => {
    if (!user || !videoId) {
      setMessages([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await api.getChatMessages(videoId)
      setMessages(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, videoId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const sendMessage = async (content, transcriptRaw, videoTitle, snips = []) => {
    if (!user || !videoId) throw new Error('Not authenticated or no video selected')
    if (!content.trim()) return

    setSending(true)
    setError(null)
    setLastFailedMessage(null)

    try {
      // Add user message to UI immediately
      const userMessage = await api.createChatMessage(user.id, videoId, 'user', content)
      setMessages(prev => [...prev, userMessage])

      // Get AI response with snips context
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }))

      const response = await claude.chatWithVideo(
        transcriptRaw,
        history,
        content,
        videoTitle,
        snips
      )

      // Save and display assistant message
      const assistantMessage = await api.createChatMessage(
        user.id,
        videoId,
        'assistant',
        response.response
      )
      setMessages(prev => [...prev, assistantMessage])

      return assistantMessage
    } catch (err) {
      const errorMessage = err.message || 'Failed to get response'
      setError(errorMessage)
      setLastFailedMessage({ content, transcriptRaw, videoTitle, snips })
      throw err
    } finally {
      setSending(false)
    }
  }

  // Retry the last failed message
  const retryLastMessage = async () => {
    if (!lastFailedMessage) return

    const { content, transcriptRaw, videoTitle, snips } = lastFailedMessage
    return sendMessage(content, transcriptRaw, videoTitle, snips)
  }

  const clearHistory = async () => {
    if (!videoId) return

    try {
      await api.clearChatHistory(videoId)
      setMessages([])
      setError(null)
      setLastFailedMessage(null)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const clearError = () => {
    setError(null)
    setLastFailedMessage(null)
  }

  return {
    messages,
    loading,
    sending,
    error,
    lastFailedMessage,
    sendMessage,
    retryLastMessage,
    clearHistory,
    clearError,
    refreshMessages: fetchMessages
  }
}
