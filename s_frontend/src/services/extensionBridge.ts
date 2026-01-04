/**
 * Extension Bridge Service
 *
 * This service enables communication between the web app and the Chrome extension.
 * It uses two methods:
 * 1. window.postMessage - for content script communication
 * 2. chrome.runtime.sendMessage - for direct extension communication (when externally_connectable is configured)
 *
 * Session data is stored in localStorage for persistence.
 */

// Extension ID - Replace with your actual extension ID when published
// You can find this in chrome://extensions when the extension is loaded
const EXTENSION_ID = "your-extension-id-here"; // TODO: Update with actual extension ID

// Message types for communication
export const MESSAGE_TYPES = {
  // Web app -> Extension
  SESSION_DATA: "TREX_SESSION_DATA",
  AUTH_STATE: "TREX_AUTH_STATE",
  REQUEST_SESSION: "TREX_REQUEST_SESSION",

  // Extension -> Web app
  SESSION_RECEIVED: "TREX_SESSION_RECEIVED",
  EXTENSION_READY: "TREX_EXTENSION_READY",
} as const;

// Storage keys
const STORAGE_KEYS = {
  SESSION: "trex_session",
  AUTH_STATE: "trex_auth_state",
  LAST_SYNC: "trex_last_sync",
} as const;

// Session data interface
export interface SessionData {
  isConnected: boolean;
  currentAccount: {
    address: string;
    network: string;
  } | null;
  timestamp: number;
}

// Check if running as Chrome extension
export const isExtension = (): boolean => {
  return (
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    !!chrome.runtime.id &&
    window.location.protocol === "chrome-extension:"
  );
};

// Check if extension is available (for web app to detect)
export const isExtensionAvailable = (): boolean => {
  return (
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    !!chrome.runtime.sendMessage
  );
};

/**
 * Save session data to localStorage
 */
export const saveSessionToStorage = (sessionData: SessionData): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
  } catch (error) {
    console.error(
      "[ExtensionBridge] Failed to save session to storage:",
      error
    );
  }
};

/**
 * Get session data from localStorage
 */
export const getSessionFromStorage = (): SessionData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(
      "[ExtensionBridge] Failed to get session from storage:",
      error
    );
  }
  return null;
};

/**
 * Clear session data from localStorage
 */
export const clearSessionStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
  } catch (error) {
    console.error("[ExtensionBridge] Failed to clear session storage:", error);
  }
};

/**
 * Send session data from web app to extension via postMessage
 * This is used when the web app wants to share session with the extension
 */
export const sendSessionToExtension = (sessionData: SessionData): void => {
  // Save to localStorage first
  saveSessionToStorage(sessionData);

  // Send via postMessage (content script will pick this up)
  window.postMessage(
    {
      type: MESSAGE_TYPES.SESSION_DATA,
      source: "trex-web",
      data: sessionData,
    },
    "*"
  );

  // Also try direct extension messaging if available
  if (isExtensionAvailable() && EXTENSION_ID !== "your-extension-id-here") {
    try {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        {
          type: MESSAGE_TYPES.SESSION_DATA,
          data: sessionData,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            // Extension not installed or not listening - this is normal
            console.log(
              "[ExtensionBridge] Extension not responding (may not be installed)"
            );
          } else if (response?.success) {
            console.log(
              "[ExtensionBridge] Session sent to extension successfully"
            );
          }
        }
      );
    } catch {
      // Silently fail - extension might not be installed
    }
  }
};

/**
 * Request session data from extension (for web app)
 */
export const requestSessionFromExtension = (): void => {
  window.postMessage(
    {
      type: MESSAGE_TYPES.REQUEST_SESSION,
      source: "trex-web",
    },
    "*"
  );
};

/**
 * Listen for session data from extension (for web app)
 * Returns a cleanup function
 */
export const listenForExtensionSession = (
  callback: (sessionData: SessionData) => void
): (() => void) => {
  const handler = (event: MessageEvent) => {
    // Only accept messages from ourselves
    if (event.source !== window) return;

    const message = event.data;
    if (
      message &&
      message.type === MESSAGE_TYPES.SESSION_RECEIVED &&
      message.source === "trex-extension"
    ) {
      console.log(
        "[ExtensionBridge] Received session from extension:",
        message.data
      );
      callback(message.data);
    }
  };

  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
};

/**
 * Content script setup - listens for messages from web app and forwards to extension
 * This should be called in the content script
 */
export const setupContentScriptBridge = (): void => {
  // Connect to the extension background script
  const port = chrome.runtime.connect({ name: "trex-bridge" });

  // Listen for messages from the web page
  window.addEventListener("message", (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return;

    const message = event.data;

    // Only handle messages from our web app
    if (message && message.source === "trex-web") {
      console.log(
        "[ContentScript] Received message from web app:",
        message.type
      );

      // Forward to extension background
      if (message.type === MESSAGE_TYPES.SESSION_DATA) {
        port.postMessage({
          type: MESSAGE_TYPES.SESSION_DATA,
          data: message.data,
        });

        // Also save to chrome.storage for persistence
        chrome.storage.local.set({
          [STORAGE_KEYS.SESSION]: message.data,
          [STORAGE_KEYS.LAST_SYNC]: Date.now(),
        });
      }

      if (message.type === MESSAGE_TYPES.REQUEST_SESSION) {
        // Get session from chrome.storage and send back
        chrome.storage.local.get([STORAGE_KEYS.SESSION], (result) => {
          if (result[STORAGE_KEYS.SESSION]) {
            window.postMessage(
              {
                type: MESSAGE_TYPES.SESSION_RECEIVED,
                source: "trex-extension",
                data: result[STORAGE_KEYS.SESSION],
              },
              "*"
            );
          }
        });
      }
    }
  });

  // Listen for messages from extension background
  port.onMessage.addListener((message) => {
    if (message.type === MESSAGE_TYPES.SESSION_DATA) {
      // Forward session data to web page
      window.postMessage(
        {
          type: MESSAGE_TYPES.SESSION_RECEIVED,
          source: "trex-extension",
          data: message.data,
        },
        "*"
      );
    }
  });

  // Notify web app that extension is ready
  window.postMessage(
    {
      type: MESSAGE_TYPES.EXTENSION_READY,
      source: "trex-extension",
    },
    "*"
  );
};

/**
 * Extension background script setup - handles session storage and sync
 * This should be called in the service worker
 */
export const setupBackgroundBridge = (): void => {
  // Listen for connections from content scripts
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== "trex-bridge") return;

    console.log("[Background] Content script connected");

    port.onMessage.addListener((message) => {
      if (message.type === MESSAGE_TYPES.SESSION_DATA) {
        // Save session to chrome.storage
        chrome.storage.local.set({
          [STORAGE_KEYS.SESSION]: message.data,
          [STORAGE_KEYS.LAST_SYNC]: Date.now(),
        });
        console.log("[Background] Session saved to storage");
      }
    });
  });

  // Listen for external messages from web app (if externally_connectable is configured)
  chrome.runtime.onMessageExternal.addListener(
    (request, sender, sendResponse) => {
      console.log("[Background] External message from:", sender.url);

      if (request.type === MESSAGE_TYPES.SESSION_DATA) {
        // Save session to chrome.storage
        chrome.storage.local.set({
          [STORAGE_KEYS.SESSION]: request.data,
          [STORAGE_KEYS.LAST_SYNC]: Date.now(),
        });
        sendResponse({ success: true });
      }

      if (request.type === MESSAGE_TYPES.REQUEST_SESSION) {
        // Return session data
        chrome.storage.local.get([STORAGE_KEYS.SESSION], (result) => {
          sendResponse({
            success: true,
            data: result[STORAGE_KEYS.SESSION] || null,
          });
        });
        return true; // Keep message channel open for async response
      }
    }
  );
};

/**
 * Hook for React components to sync session with extension
 * Usage: useExtensionSync(sessionData, isConnected)
 */
export const syncSessionWithExtension = (
  isConnected: boolean,
  currentAccount: { address: string; network: string } | null
): void => {
  const sessionData: SessionData = {
    isConnected,
    currentAccount,
    timestamp: Date.now(),
  };

  sendSessionToExtension(sessionData);
};
