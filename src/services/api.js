import { supabase } from '../lib/supabase'

// Helper to wrap Supabase calls with timeout and retry
// Fixes stale connections after tab switch
async function withRetry(operation, timeoutMs = 8000) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
  )

  try {
    return await Promise.race([operation(), timeout])
  } catch (error) {
    // On timeout, connection, or auth error, refresh session and retry once
    const msg = error.message || ''
    const isRetryable = msg === 'Request timeout'
      || msg.includes('fetch')
      || msg.includes('JWT')
      || msg.includes('token')
      || error.code === 'PGRST301'
      || error.status === 401
    if (isRetryable) {
      console.log('Connection stale or auth error, refreshing session and retrying...')
      await supabase.auth.refreshSession()
      return operation()
    }
    throw error
  }
}

// ============ Videos ============

export async function getVideos(userId) {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        snips:snips(count),
        tags:video_tags(tag:tags(*))
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform the data to flatten snips count and tags
    return data.map(video => ({
      ...video,
      snipsCount: video.snips?.[0]?.count || 0,
      tags: video.tags?.map(vt => vt.tag) || []
    }))
  })
}

export async function getVideo(videoId) {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        snips:snips(count),
        tags:video_tags(tag:tags(*)),
        summary:summaries(*)
      `)
      .eq('id', videoId)
      .single()

    if (error) throw error

    return {
      ...data,
      snipsCount: data.snips?.[0]?.count || 0,
      tags: data.tags?.map(vt => vt.tag) || [],
      summary: data.summary?.[0] || null
    }
  })
}

export async function createVideo(userId, videoData) {
  const { data, error } = await supabase
    .from('videos')
    .insert({
      user_id: userId,
      ...videoData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateVideo(videoId, updates) {
  const { data, error } = await supabase
    .from('videos')
    .update(updates)
    .eq('id', videoId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteVideo(videoId) {
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', videoId)

  if (error) throw error
}

export async function updateVideoTranscript(videoId, transcript, transcriptRaw) {
  const { data, error } = await supabase
    .from('videos')
    .update({
      transcript,
      transcript_raw: transcriptRaw
    })
    .eq('id', videoId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============ Snips ============

export async function getSnips(userId, videoId = null) {
  let query = supabase
    .from('snips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (videoId) {
    query = query.eq('video_id', videoId)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getSnipsForVideo(videoId) {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('snips')
      .select(`
        *,
        tags:snip_tags(tag:tags(*))
      `)
      .eq('video_id', videoId)
      .order('timestamp_seconds', { ascending: true })

    if (error) throw error

    // Transform to flatten tags
    return data.map(snip => ({
      ...snip,
      tags: snip.tags?.map(st => st.tag) || []
    }))
  })
}

export async function createSnip(userId, snipData) {
  const { data, error } = await supabase
    .from('snips')
    .insert({
      user_id: userId,
      ...snipData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSnip(snipId, updates) {
  const { data, error } = await supabase
    .from('snips')
    .update(updates)
    .eq('id', snipId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteSnip(snipId) {
  const { error } = await supabase
    .from('snips')
    .delete()
    .eq('id', snipId)

  if (error) throw error
}

export async function toggleSnipStar(snipId, starred) {
  return updateSnip(snipId, { starred })
}

// ============ Summaries ============

export async function getSummary(videoId) {
  const { data, error } = await supabase
    .from('summaries')
    .select('*')
    .eq('video_id', videoId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
  return data
}

export async function createSummary(videoId, summaryData = {}) {
  const { data, error } = await supabase
    .from('summaries')
    .insert({
      video_id: videoId,
      ...summaryData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSummary(videoId, updates) {
  const { data, error } = await supabase
    .from('summaries')
    .update(updates)
    .eq('video_id', videoId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============ Tags ============

export async function getTags(userId) {
  const { data, error } = await supabase
    .from('tags')
    .select(`
      *,
      videos:video_tags(count),
      snips:snip_tags(count)
    `)
    .eq('user_id', userId)
    .order('name')

  if (error) throw error

  return data.map(tag => ({
    ...tag,
    videoCount: tag.videos?.[0]?.count || 0,
    snipCount: tag.snips?.[0]?.count || 0,
    count: (tag.videos?.[0]?.count || 0) + (tag.snips?.[0]?.count || 0)
  }))
}

export async function createTag(userId, name, color = '#6B7280') {
  const { data, error } = await supabase
    .from('tags')
    .insert({
      user_id: userId,
      name,
      color
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTag(tagId, updates) {
  const { data, error } = await supabase
    .from('tags')
    .update(updates)
    .eq('id', tagId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTag(tagId) {
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', tagId)

  if (error) throw error
}

export async function addTagToVideo(videoId, tagId) {
  const { error } = await supabase
    .from('video_tags')
    .insert({
      video_id: videoId,
      tag_id: tagId
    })

  if (error) throw error
}

export async function removeTagFromVideo(videoId, tagId) {
  const { error } = await supabase
    .from('video_tags')
    .delete()
    .match({
      video_id: videoId,
      tag_id: tagId
    })

  if (error) throw error
}

export async function getVideosForTag(tagId) {
  // First get video_ids from video_tags
  const { data: videoTags, error: vtError } = await supabase
    .from('video_tags')
    .select('video_id')
    .eq('tag_id', tagId)

  if (vtError) throw vtError
  if (!videoTags || videoTags.length === 0) return []

  // Then fetch the actual videos
  const videoIds = videoTags.map(vt => vt.video_id)
  const { data: videos, error: vError } = await supabase
    .from('videos')
    .select('*')
    .in('id', videoIds)

  if (vError) throw vError
  return videos || []
}

export async function addTagToSnip(snipId, tagId) {
  const { error } = await supabase
    .from('snip_tags')
    .insert({
      snip_id: snipId,
      tag_id: tagId
    })

  if (error) throw error
}

export async function removeTagFromSnip(snipId, tagId) {
  const { error } = await supabase
    .from('snip_tags')
    .delete()
    .match({
      snip_id: snipId,
      tag_id: tagId
    })

  if (error) throw error
}

export async function getSnipsForTag(tagId) {
  // First get snip_ids from snip_tags
  const { data: snipTags, error: stError } = await supabase
    .from('snip_tags')
    .select('snip_id')
    .eq('tag_id', tagId)

  if (stError) throw stError
  if (!snipTags || snipTags.length === 0) return []

  // Then fetch the actual snips with video info
  const snipIds = snipTags.map(st => st.snip_id)
  const { data: snips, error: sError } = await supabase
    .from('snips')
    .select(`
      *,
      video:videos(title, youtube_id, thumbnail_url)
    `)
    .in('id', snipIds)

  if (sError) throw sError
  return snips || []
}

// ============ Chat Messages ============

export async function getChatMessages(videoId) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('video_id', videoId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function createChatMessage(userId, videoId, role, content) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId,
      video_id: videoId,
      role,
      content
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function clearChatHistory(videoId) {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('video_id', videoId)

  if (error) throw error
}

// ============ Search ============

export async function searchVideos(userId, query) {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', userId)
    .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data
}

export async function searchSnips(userId, query) {
  const { data, error } = await supabase
    .from('snips')
    .select(`
      *,
      video:videos(title, youtube_id, thumbnail_url)
    `)
    .eq('user_id', userId)
    .ilike('title', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data
}

// ============ Stats ============

export async function getStats(userId) {
  const [videosResult, snipsResult] = await Promise.all([
    supabase
      .from('videos')
      .select('status', { count: 'exact' })
      .eq('user_id', userId),
    supabase
      .from('snips')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
  ])

  const videos = videosResult.data || []
  const inProgress = videos.filter(v => v.status === 'in_progress').length
  const completed = videos.filter(v => v.status === 'completed').length

  return {
    totalVideos: videosResult.count || 0,
    inProgress,
    completed,
    totalSnips: snipsResult.count || 0
  }
}
