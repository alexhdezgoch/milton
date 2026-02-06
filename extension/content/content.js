// Milton Content Script - Injects Snip button into YouTube player

(function() {
  'use strict';

  const BUTTON_ID = 'milton-snip-button';
  let currentVideoId = null;
  let urlCheckInterval = null;

  /**
   * Format seconds into human-readable duration (e.g., "3:45" or "1:23:45")
   */
  function formatDuration(seconds) {
    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Extract video ID from YouTube URL
   */
  function extractVideoId(url) {
    const urlObj = new URL(url);

    // Standard watch URL: youtube.com/watch?v=VIDEO_ID
    if (urlObj.searchParams.has('v')) {
      return urlObj.searchParams.get('v');
    }

    // Short URL: youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }

    // Embed URL: youtube.com/embed/VIDEO_ID
    const embedMatch = urlObj.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) {
      return embedMatch[1];
    }

    return null;
  }

  /**
   * Get the main video element
   */
  function getVideoElement() {
    return document.querySelector('video.html5-main-video') ||
           document.querySelector('#movie_player video');
  }

  /**
   * Get video metadata from the page
   */
  function getVideoMetadata() {
    const videoId = extractVideoId(window.location.href);

    // Get video title
    const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string') ||
                         document.querySelector('h1.title.ytd-video-primary-info-renderer') ||
                         document.querySelector('#title h1 yt-formatted-string');
    const videoTitle = titleElement?.textContent?.trim() || 'Unknown Title';

    // Get channel name
    const channelElement = document.querySelector('#channel-name a') ||
                          document.querySelector('ytd-channel-name a') ||
                          document.querySelector('.ytd-channel-name a');
    const videoAuthor = channelElement?.textContent?.trim() || 'Unknown Channel';

    // Generate thumbnail URL
    const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : '';

    return {
      videoId,
      videoTitle,
      videoAuthor,
      thumbnailUrl
    };
  }

  /**
   * Create the Snip button element matching YouTube's engagement button style
   */
  function createSnipButton() {
    const container = document.createElement('div');
    container.id = BUTTON_ID;
    container.className = 'style-scope ytd-menu-renderer';

    const button = document.createElement('button');
    button.className = 'yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m milton-snip-btn';
    button.setAttribute('aria-label', 'Snip this moment');
    button.title = 'Snip this moment (Milton)';
    button.style.cssText = 'display: inline-flex !important; visibility: visible !important;';

    button.innerHTML = `
      <div class="yt-spec-button-shape-next__icon" style="margin-right: 6px;">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3h-3z"/>
        </svg>
      </div>
      <div class="yt-spec-button-shape-next__button-text-content">
        <span class="yt-core-attributed-string">Snip</span>
      </div>
    `;

    button.addEventListener('click', handleSnipClick);
    container.appendChild(button);
    return container;
  }

  /**
   * Handle Snip button click
   */
  async function handleSnipClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const video = getVideoElement();
    if (!video) {
      console.error('[Milton] Could not find video element');
      return;
    }

    const currentTime = video.currentTime;
    const metadata = getVideoMetadata();

    if (!metadata.videoId) {
      console.error('[Milton] Could not extract video ID');
      return;
    }

    const timestampFormatted = formatDuration(currentTime);

    const snip = {
      id: crypto.randomUUID(),
      videoId: metadata.videoId,
      videoTitle: metadata.videoTitle,
      videoAuthor: metadata.videoAuthor,
      thumbnailUrl: metadata.thumbnailUrl,
      timestampSeconds: currentTime,
      timestampFormatted: timestampFormatted,
      title: `Snip at ${timestampFormatted}`,
      createdAt: new Date().toISOString()
    };

    // Send to service worker for storage
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_SNIP',
        snip: snip
      });
      if (response?.success) {
        showSnipFeedback(true);
        console.log('[Milton] Snip saved:', snip.title);
      } else {
        showSnipFeedback(false);
        console.error('[Milton] Save failed:', response?.error);
      }
    } catch (error) {
      showSnipFeedback(false);
      console.error('[Milton] Failed to save snip:', error);
    }
  }

  /**
   * Show visual feedback when snip is captured
   */
  function showSnipFeedback(success = true) {
    const container = document.getElementById(BUTTON_ID);
    const button = container?.querySelector('.milton-snip-btn');
    if (button) {
      const feedbackClass = success ? 'milton-snip-active' : 'milton-snip-error';
      button.classList.add(feedbackClass);
      setTimeout(() => {
        button.classList.remove(feedbackClass);
      }, 300);
    }
  }

  /**
   * Inject the Snip button into YouTube engagement buttons area
   */
  function injectSnipButton() {
    // Don't inject if already present
    if (document.getElementById(BUTTON_ID)) {
      return;
    }

    const container = document.querySelector('#top-level-buttons-computed');
    if (!container) {
      return;
    }

    const button = createSnipButton();

    // Insert before the last button (typically the three-dot menu)
    const buttons = container.querySelectorAll(':scope > yt-button-renderer');
    const lastButton = buttons[buttons.length - 1];

    if (lastButton) {
      container.insertBefore(button, lastButton);
    } else {
      container.appendChild(button);
    }
    console.log('[Milton] Snip button injected');
  }

  /**
   * Remove the Snip button
   */
  function removeSnipButton() {
    const button = document.getElementById(BUTTON_ID);
    if (button) {
      button.remove();
    }
  }

  /**
   * Check if we're on a video page and handle navigation
   */
  function handleNavigation() {
    const newVideoId = extractVideoId(window.location.href);

    if (newVideoId && newVideoId !== currentVideoId) {
      currentVideoId = newVideoId;
      // Small delay to allow YouTube to render controls
      setTimeout(injectSnipButton, 500);
    } else if (!newVideoId) {
      currentVideoId = null;
      removeSnipButton();
    }
  }

  /**
   * Set up MutationObserver to re-inject button if YouTube removes it
   */
  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      // Check if our button was removed
      if (currentVideoId && !document.getElementById(BUTTON_ID)) {
        const container = document.querySelector('#top-level-buttons-computed');
        if (container) {
          injectSnipButton();
        }
      }
    });

    // Observe the metadata area (more stable than player for engagement buttons)
    const target = document.querySelector('#above-the-fold') ||
                   document.querySelector('ytd-watch-metadata');
    if (target) {
      observer.observe(target, {
        childList: true,
        subtree: true
      });
    }
  }

  /**
   * Initialize the content script
   */
  function init() {
    // Initial injection
    handleNavigation();

    // Listen for YouTube SPA navigation events
    document.addEventListener('yt-navigate-finish', () => {
      setTimeout(handleNavigation, 300);
    });

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', () => {
      setTimeout(handleNavigation, 300);
    });

    // Fallback: poll URL every second for navigation changes
    urlCheckInterval = setInterval(() => {
      const newVideoId = extractVideoId(window.location.href);
      if (newVideoId !== currentVideoId) {
        handleNavigation();
      }
    }, 1000);

    // Set up MutationObserver after a delay
    setTimeout(setupMutationObserver, 1000);

    console.log('[Milton] Content script initialized');
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
