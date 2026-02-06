// Milton Popup Script

const WEB_APP_URL = 'https://milton-chi.vercel.app';

document.addEventListener('DOMContentLoaded', init);

// Listen for storage changes to auto-refresh UI
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.milton_snips) {
      loadSnips();
    }
    if (changes.milton_auth) {
      loadAuthStatus();
    }
  }
});

async function init() {
  await Promise.all([
    loadAuthStatus(),
    loadSnips()
  ]);
  setupEventListeners();
}

/**
 * Load and display auth status
 */
async function loadAuthStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_AUTH_SESSION' });

    const authText = document.getElementById('auth-text');
    const authBtn = document.getElementById('auth-btn');

    if (response.success && response.session?.user) {
      // User is signed in
      const email = response.session.user.email || 'Synced';
      authText.textContent = email;
      authText.classList.add('synced');
      authBtn.textContent = 'Sign out';
      authBtn.classList.add('signout');
    } else {
      // User is not signed in
      authText.textContent = 'Not synced';
      authText.classList.remove('synced');
      authBtn.textContent = 'Sign in';
      authBtn.classList.remove('signout');
    }
  } catch (error) {
    console.error('Failed to load auth status:', error);
  }
}

/**
 * Load snips from storage and render
 */
async function loadSnips() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SNIPS' });

    if (response.success) {
      renderSnips(response.snips);
    } else {
      console.error('Failed to load snips:', response.error);
    }
  } catch (error) {
    console.error('Failed to load snips:', error);
  }
}

/**
 * Render snips grouped by video
 */
function renderSnips(snips) {
  const emptyState = document.getElementById('empty-state');
  const snipsList = document.getElementById('snips-list');
  const clearAllBtn = document.getElementById('clear-all-btn');

  if (!snips || snips.length === 0) {
    emptyState.classList.remove('hidden');
    snipsList.classList.add('hidden');
    snipsList.innerHTML = '';
    clearAllBtn.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  snipsList.classList.remove('hidden');
  clearAllBtn.classList.remove('hidden');

  // Group snips by video
  const groupedSnips = groupByVideo(snips);

  // Sort groups by most recent snip
  const sortedGroups = Object.values(groupedSnips).sort((a, b) => {
    const aLatest = Math.max(...a.snips.map(s => new Date(s.createdAt).getTime()));
    const bLatest = Math.max(...b.snips.map(s => new Date(s.createdAt).getTime()));
    return bLatest - aLatest;
  });

  snipsList.innerHTML = sortedGroups.map(group => renderVideoGroup(group)).join('');
}

/**
 * Group snips by video ID
 */
function groupByVideo(snips) {
  const groups = {};

  for (const snip of snips) {
    if (!groups[snip.videoId]) {
      groups[snip.videoId] = {
        videoId: snip.videoId,
        videoTitle: snip.videoTitle,
        videoAuthor: snip.videoAuthor,
        thumbnailUrl: snip.thumbnailUrl,
        snips: []
      };
    }
    groups[snip.videoId].snips.push(snip);
  }

  // Sort snips within each group by timestamp
  for (const group of Object.values(groups)) {
    group.snips.sort((a, b) => a.timestampSeconds - b.timestampSeconds);
  }

  return groups;
}

/**
 * Render a video group
 */
function renderVideoGroup(group) {
  const snipCount = group.snips.length;
  const snipText = snipCount === 1 ? '1 snip' : `${snipCount} snips`;

  return `
    <div class="video-group">
      <div class="video-header" data-video-id="${escapeHtml(group.videoId)}">
        <img class="video-thumbnail" src="${escapeHtml(group.thumbnailUrl)}" alt="" loading="lazy">
        <div class="video-info">
          <div class="video-title" title="${escapeHtml(group.videoTitle)}">${escapeHtml(group.videoTitle)}</div>
          <div class="video-author">${escapeHtml(group.videoAuthor)}</div>
          <div class="snip-count">${snipText}</div>
        </div>
      </div>
      <div class="snip-items">
        ${group.snips.map(snip => renderSnipItem(snip)).join('')}
      </div>
    </div>
  `;
}

/**
 * Render a single snip item
 */
function renderSnipItem(snip) {
  const date = formatRelativeDate(new Date(snip.createdAt));
  const youtubeUrl = `https://www.youtube.com/watch?v=${snip.videoId}&t=${Math.floor(snip.timestampSeconds)}s`;

  return `
    <div class="snip-item" data-snip-id="${escapeHtml(snip.id)}">
      <a class="snip-timestamp" href="${escapeHtml(youtubeUrl)}" target="_blank" title="Open in YouTube">
        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        ${escapeHtml(snip.timestampFormatted)}
      </a>
      <div class="snip-meta">
        <span class="snip-date">${date}</span>
        <button class="delete-btn" title="Delete snip" data-snip-id="${escapeHtml(snip.id)}">
          <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>
    </div>
  `;
}

/**
 * Format date as relative time
 */
function formatRelativeDate(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  const snipsList = document.getElementById('snips-list');
  const clearAllBtn = document.getElementById('clear-all-btn');
  const authBtn = document.getElementById('auth-btn');

  // Auth button click
  authBtn.addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GET_AUTH_SESSION' });

    if (response.success && response.session?.user) {
      // Sign out
      await chrome.runtime.sendMessage({ type: 'CLEAR_AUTH_SESSION' });
      await loadAuthStatus();
    } else {
      // Open web app to sign in
      chrome.tabs.create({ url: `${WEB_APP_URL}?connect_extension=true` });
    }
  });

  // Delegate click events for snip list
  snipsList.addEventListener('click', async (e) => {
    // Handle delete button
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation();
      const snipId = deleteBtn.dataset.snipId;
      await deleteSnip(snipId);
      return;
    }

    // Handle video header click (open first snip)
    const videoHeader = e.target.closest('.video-header');
    if (videoHeader) {
      const videoId = videoHeader.dataset.videoId;
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      chrome.tabs.create({ url });
    }
  });

  // Clear all button
  clearAllBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete all snips?')) {
      await clearAllSnips();
    }
  });
}

/**
 * Delete a single snip
 */
async function deleteSnip(snipId) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'DELETE_SNIP',
      snipId: snipId
    });

    if (response.success) {
      await loadSnips();
    } else {
      console.error('Failed to delete snip:', response.error);
    }
  } catch (error) {
    console.error('Failed to delete snip:', error);
  }
}

/**
 * Clear all snips
 */
async function clearAllSnips() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'CLEAR_ALL_SNIPS' });

    if (response.success) {
      await loadSnips();
    } else {
      console.error('Failed to clear snips:', response.error);
    }
  } catch (error) {
    console.error('Failed to clear snips:', error);
  }
}
