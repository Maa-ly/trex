declare const chrome: any;
// Background service worker for the extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Media NFT Tracker extension installed');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message: any) => {
  if (message.type === 'MEDIA_DETECTED') {
    // Handle detected media
    console.log('Media detected:', message.data);
    // Store or process the detected media
  }
  return true;
});

// Listen for tab updates to detect media
chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: any, tab: any) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Inject content script to detect media
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    }).catch(() => {
      // Ignore errors for pages where we can't inject
    });
  }
});
