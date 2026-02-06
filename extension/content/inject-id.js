// Inject extension ID into the page for web app communication
// Uses postMessage to avoid CSP inline script restrictions
(function() {
  'use strict';

  // Only inject on Milton web app pages
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' &&
      hostname !== 'milton.video' &&
      hostname !== 'www.milton.video' &&
      hostname !== 'milton-chi.vercel.app') {
    return;
  }

  // Send extension ID via postMessage (CSP-safe)
  window.postMessage({
    type: 'MILTON_EXTENSION_ID',
    extensionId: chrome.runtime.id
  }, '*');

  // Also set a data attribute as fallback
  document.documentElement.dataset.miltonExtensionId = chrome.runtime.id;

  console.log('[Milton] Extension ID injected:', chrome.runtime.id);
})();
