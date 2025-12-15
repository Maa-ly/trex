// Content script for detecting media on web pages

import { detectMediaFromURL, generateMediaId } from '@/utils/mediaDetection';
import { MediaType } from '@/config/constants';

// Get privacy settings from storage
chrome.storage.local.get(['privacySettings'], (result) => {
  const privacySettings = result.privacySettings || {
    trackMovies: false,
    trackAnime: false,
    trackComics: false,
    trackBooks: false,
    trackManga: false,
    trackShows: false,
    autoMint: true,
  };

  // Detect media from current page
  const detectedMedia = detectMediaFromURL(window.location.href, privacySettings);

  if (detectedMedia) {
    // Send message to background script
    chrome.runtime.sendMessage({
      type: 'MEDIA_DETECTED',
      data: {
        ...detectedMedia,
        mediaId: generateMediaId(detectedMedia.title, detectedMedia.type),
        timestamp: Date.now(),
      },
    });

    // Show notification badge
    chrome.runtime.sendMessage({
      type: 'SHOW_NOTIFICATION',
      data: {
        title: 'Media Detected',
        message: `Tracking: ${detectedMedia.title}`,
      },
    });
  }
});

// Listen for page changes (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Re-detect media on URL change
    chrome.storage.local.get(['privacySettings'], (result) => {
      const privacySettings = result.privacySettings || {};
      const detectedMedia = detectMediaFromURL(url, privacySettings);
      if (detectedMedia) {
        chrome.runtime.sendMessage({
          type: 'MEDIA_DETECTED',
          data: {
            ...detectedMedia,
            mediaId: generateMediaId(detectedMedia.title, detectedMedia.type),
            timestamp: Date.now(),
          },
        });
      }
    });
  }
}).observe(document, { subtree: true, childList: true });

