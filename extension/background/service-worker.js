// Milton Service Worker - Handles storage and Supabase sync

const STORAGE_KEY = 'milton_snips';
const AUTH_KEY = 'milton_auth';

// Supabase config
const SUPABASE_URL = 'https://jdrhajabucokwfnlyaix.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcmhhamFidWNva3dmbmx5YWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MjA1MzMsImV4cCI6MjA4NTI5NjUzM30.xJ-2l3J6FqtC3K7ihwjSXsXWpJ2SfMHJbthwpGQZlgA';

// Queue for sequential save operations to prevent race conditions
let saveQueue = Promise.resolve();

/**
 * Get auth session from storage
 */
async function getAuthSession() {
  const result = await chrome.storage.local.get(AUTH_KEY);
  return result[AUTH_KEY] || null;
}

/**
 * Save auth session to storage
 */
async function saveAuthSession(session) {
  await chrome.storage.local.set({ [AUTH_KEY]: session });
  console.log('[Milton SW] Auth session saved');
}

/**
 * Clear auth session
 */
async function clearAuthSession() {
  await chrome.storage.local.remove(AUTH_KEY);
  console.log('[Milton SW] Auth session cleared');
}

/**
 * Make authenticated Supabase request
 */
async function supabaseRequest(endpoint, options = {}) {
  const session = await getAuthSession();

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': session?.access_token
      ? `Bearer ${session.access_token}`
      : `Bearer ${SUPABASE_ANON_KEY}`
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase error: ${response.status} - ${error}`);
  }

  // Return null for 204 No Content responses (like DELETE)
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * Get or create video in Supabase
 */
async function getOrCreateVideo(session, snip) {
  // First, check if video exists
  const videos = await supabaseRequest(
    `/videos?youtube_id=eq.${snip.videoId}&user_id=eq.${session.user.id}&select=id`,
    { method: 'GET' }
  );

  if (videos && videos.length > 0) {
    return videos[0].id;
  }

  // Create new video
  const newVideo = await supabaseRequest('/videos', {
    method: 'POST',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({
      user_id: session.user.id,
      youtube_id: snip.videoId,
      youtube_url: `https://www.youtube.com/watch?v=${snip.videoId}`,
      title: snip.videoTitle,
      author: snip.videoAuthor,
      thumbnail_url: snip.thumbnailUrl,
      status: 'in_progress'
    })
  });

  return newVideo[0].id;
}

/**
 * Invoke a Supabase edge function
 */
async function invokeEdgeFunction(functionName, body) {
  const session = await getAuthSession();
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;

  console.log(`[Milton SW] Calling edge function: ${functionName}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[Milton SW] Edge function ${functionName} failed:`, response.status, error);
    throw new Error(`Edge function error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log(`[Milton SW] Edge function ${functionName} response:`, data);
  return data;
}

/**
 * Get transcript context around a timestamp
 */
function getTranscriptContext(segments, timestampSeconds, beforeWindow = 30, afterWindow = 15) {
  if (!segments || segments.length === 0) return { context: '', startSeconds: 0, endSeconds: 0 };

  const startTime = Math.max(0, timestampSeconds - beforeWindow);
  const endTime = timestampSeconds + afterWindow;

  const relevantSegments = segments.filter(
    segment => segment.start >= startTime && segment.start <= endTime
  );

  return {
    context: relevantSegments.map(s => s.text).join(' '),
    startSeconds: startTime,
    endSeconds: endTime
  };
}

/**
 * Generate AI notes for a snip using Claude
 */
async function generateAINotes(snip, snipId) {
  try {
    // Fetch transcript
    console.log('[Milton SW] Fetching transcript for AI generation...');
    const transcriptData = await invokeEdgeFunction('transcript', { videoId: snip.videoId });

    if (transcriptData.error || transcriptData.noCaptions || !transcriptData.segments?.length) {
      console.log('[Milton SW] No transcript available, skipping AI generation');
      return null;
    }

    // Get context around the timestamp
    const { context, startSeconds, endSeconds } = getTranscriptContext(
      transcriptData.segments,
      snip.timestampSeconds
    );

    if (!context) {
      console.log('[Milton SW] No context found around timestamp');
      return null;
    }

    // Generate snip content with Claude
    console.log('[Milton SW] Generating AI notes...');
    const aiSnip = await invokeEdgeFunction('snip', {
      context,
      timestamp: snip.timestampSeconds,
      videoTitle: snip.videoTitle,
      startSeconds,
      endSeconds
    });

    if (aiSnip.error) {
      console.error('[Milton SW] AI generation error:', aiSnip.error);
      return null;
    }

    // Update snip in Supabase with AI-generated content
    await supabaseRequest(`/snips?id=eq.${snipId}`, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({
        title: aiSnip.title,
        bullets: aiSnip.bullets || [],
        quote: aiSnip.quote,
        speaker: aiSnip.speaker,
        ai_generated: true
      })
    });

    console.log('[Milton SW] Snip updated with AI notes:', aiSnip.title);
    return aiSnip;
  } catch (error) {
    console.error('[Milton SW] Failed to generate AI notes:', error);
    return null;
  }
}

/**
 * Sync snip to Supabase
 */
async function syncSnipToSupabase(snip) {
  const session = await getAuthSession();

  if (!session?.access_token || !session?.user?.id) {
    console.log('[Milton SW] Not authenticated, skipping Supabase sync. Session:', {
      hasToken: !!session?.access_token,
      hasUserId: !!session?.user?.id
    });
    return null;
  }

  try {
    // Get or create the video first
    const videoId = await getOrCreateVideo(session, snip);

    // Create snip in Supabase
    const newSnip = await supabaseRequest('/snips', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({
        user_id: session.user.id,
        video_id: videoId,
        title: snip.title,
        timestamp_seconds: Math.floor(snip.timestampSeconds),
        timestamp_formatted: snip.timestampFormatted,
        bullets: [],
        ai_generated: false
      })
    });

    console.log('[Milton SW] Snip synced to Supabase:', newSnip[0]?.id);

    // Generate AI notes in the background (don't block the snip save)
    const supabaseSnipId = newSnip[0]?.id;
    if (supabaseSnipId) {
      generateAINotes(snip, supabaseSnipId).then(result => {
        if (result) {
          console.log('[Milton SW] AI notes generated successfully');
        }
      }).catch(err => {
        console.error('[Milton SW] Background AI generation failed:', err);
      });
    } else {
      console.error('[Milton SW] No snip ID returned from Supabase');
    }

    return newSnip[0];
  } catch (error) {
    console.error('[Milton SW] Failed to sync snip to Supabase:', error);
    return null;
  }
}

/**
 * Get all snips from local storage
 */
async function getSnips() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
}

/**
 * Save a snip to local storage and sync to Supabase
 */
async function saveSnip(snip) {
  // Chain this save operation to the queue
  saveQueue = saveQueue.then(async () => {
    // Save locally first
    const snips = await getSnips();
    snips.push(snip);
    await chrome.storage.local.set({ [STORAGE_KEY]: snips });
    console.log('[Milton SW] Snip saved locally:', snip.id);

    // Sync to Supabase (non-blocking)
    syncSnipToSupabase(snip).catch(err => {
      console.error('[Milton SW] Background sync failed:', err);
    });

    return snip;
  }).catch(error => {
    console.error('[Milton SW] Failed to save snip:', error);
    throw error;
  });

  return saveQueue;
}

/**
 * Delete a snip by ID from local storage
 */
async function deleteSnip(snipId) {
  saveQueue = saveQueue.then(async () => {
    const snips = await getSnips();
    const filtered = snips.filter(s => s.id !== snipId);
    await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
    console.log('[Milton SW] Snip deleted locally:', snipId);
  }).catch(error => {
    console.error('[Milton SW] Failed to delete snip:', error);
    throw error;
  });

  return saveQueue;
}

/**
 * Clear all snips from local storage
 */
async function clearAllSnips() {
  await chrome.storage.local.set({ [STORAGE_KEY]: [] });
  console.log('[Milton SW] All local snips cleared');
}

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'SAVE_SNIP':
      saveSnip(message.snip)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep channel open for async response

    case 'GET_SNIPS':
      getSnips()
        .then(snips => sendResponse({ success: true, snips }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'DELETE_SNIP':
      deleteSnip(message.snipId)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'CLEAR_ALL_SNIPS':
      clearAllSnips()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'SET_AUTH_SESSION':
      saveAuthSession(message.session)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'GET_AUTH_SESSION':
      getAuthSession()
        .then(session => sendResponse({ success: true, session }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'CLEAR_AUTH_SESSION':
      clearAuthSession()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    default:
      console.warn('[Milton SW] Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// Listen for external messages from the web app
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  // Verify sender is our web app
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://milton.video',
    'https://www.milton.video',
    'https://milton-chi.vercel.app'
  ];

  if (!allowedOrigins.some(origin => sender.url?.startsWith(origin))) {
    console.warn('[Milton SW] Rejected message from unauthorized origin:', sender.url);
    sendResponse({ success: false, error: 'Unauthorized origin' });
    return;
  }

  switch (message.type) {
    case 'SET_AUTH_SESSION':
      saveAuthSession(message.session)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'GET_AUTH_STATUS':
      getAuthSession()
        .then(session => sendResponse({
          success: true,
          authenticated: !!session?.access_token,
          user: session?.user || null
        }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'CLEAR_AUTH_SESSION':
      clearAuthSession()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    default:
      console.warn('[Milton SW] Unknown external message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

console.log('[Milton SW] Service worker initialized');
