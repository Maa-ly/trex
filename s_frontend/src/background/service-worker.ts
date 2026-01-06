// Trex Chrome Extension - Background Service Worker

// Track active tracking sessions
interface TrackingSession {
  tabId: number;
  mediaInfo: {
    platform: string;
    type: string;
    title: string;
    url: string;
    progress?: number;
    duration?: number;
    thumbnail?: string;
    timestamp: number;
  };
  startTime: number;
  watchTime: number;
  completed: boolean;
}

const activeSessions = new Map<number, TrackingSession>();

// Extension lifecycle events
chrome.runtime.onInstalled.addListener((details) => {
  console.log("[Trex] Extension installed:", details.reason);

  if (details.reason === "install") {
    // First time installation - show onboarding
    chrome.storage.local.set({
      installed: true,
      installDate: new Date().toISOString(),
      version: chrome.runtime.getManifest().version,
      trackingEnabled: true,
      notificationsEnabled: true,
    });

    // Create context menus
    setupContextMenus();
  }

  if (details.reason === "update") {
    console.log(
      "[Trex] Extension updated to:",
      chrome.runtime.getManifest().version
    );
  }
});

// Setup context menus
function setupContextMenus() {
  chrome.contextMenus.create({
    id: "trex-search",
    title: "Search on Trex",
    contexts: ["selection"],
  });

  chrome.contextMenus.create({
    id: "trex-track",
    title: "Track this media with Trex",
    contexts: ["page"],
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "trex-search" && info.selectionText) {
    // Open popup with search query
    const searchText = encodeURIComponent(info.selectionText);
    chrome.action.setPopup({
      popup: `index.html#/explore?search=${searchText}`,
    });
    chrome.action.openPopup();
  }

  if (info.menuItemId === "trex-track" && tab?.id) {
    // Request manual tracking on current page
    chrome.tabs.sendMessage(tab.id, { type: "REQUEST_TRACKING" });
  }
});

// Handle messages from popup/content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[Trex] Message received:", message.type);

  switch (message.type) {
    // User data management
    case "GET_USER_DATA":
      chrome.storage.local.get(["userData"], (result) => {
        sendResponse({ success: true, data: result.userData });
      });
      return true;

    case "SAVE_USER_DATA":
      chrome.storage.local.set({ userData: message.data }, () => {
        sendResponse({ success: true });
      });
      return true;

    case "CLEAR_USER_DATA":
      chrome.storage.local.remove(["userData"], () => {
        sendResponse({ success: true });
      });
      return true;

    // Completions management
    case "GET_COMPLETIONS":
      chrome.storage.local.get(["completions"], (result) => {
        sendResponse({ success: true, data: result.completions || [] });
      });
      return true;

    case "ADD_COMPLETION":
      chrome.storage.local.get(["completions"], (result) => {
        const completions = result.completions || [];
        completions.push({
          ...message.data,
          id: `completion-${Date.now()}`,
          addedAt: new Date().toISOString(),
        });
        chrome.storage.local.set({ completions }, () => {
          sendResponse({ success: true });

          // Update badge
          updateBadge(completions.length);
        });
      });
      return true;

    // Media tracking messages from content script
    case "TRACKING_START":
      console.log(
        "[Trex SW] TRACKING_START received from tab:",
        sender.tab?.id
      );
      console.log("[Trex SW] Tracking data:", message.data);
      if (sender.tab?.id) {
        const trackingData = message.data;
        const session: TrackingSession = {
          tabId: sender.tab.id,
          mediaInfo: {
            platform: trackingData.platform,
            type: trackingData.type,
            title: trackingData.title,
            url: trackingData.url,
            progress: trackingData.progress || 0,
            duration: trackingData.duration || 0,
            thumbnail: trackingData.thumbnail || "",
            timestamp: Date.now(),
          },
          startTime: Date.now(),
          watchTime: 0,
          completed: false,
        };
        activeSessions.set(sender.tab.id, session);
        console.log(
          "[Trex SW] Tracking session created:",
          session.mediaInfo.title
        );
        console.log("[Trex SW] Active sessions count:", activeSessions.size);

        // Store in chrome.storage for popup access
        updateActiveTrackingStorage();
      }
      sendResponse({ success: true });
      return true;

    case "TRACKING_UPDATE":
      if (sender.tab?.id) {
        const session = activeSessions.get(sender.tab.id);
        const updateData = message.data;
        if (session) {
          session.watchTime = updateData.watchTime || session.watchTime || 0;
          session.mediaInfo.progress = updateData.progress || 0;
          session.mediaInfo.duration =
            updateData.duration || session.mediaInfo.duration || 0;
          session.mediaInfo.thumbnail =
            updateData.thumbnail || session.mediaInfo.thumbnail || "";
          session.completed = updateData.completed || session.completed;
          console.log("[Trex] Tracking update:", {
            title: session.mediaInfo.title,
            progress: session.mediaInfo.progress,
            watchTime: session.watchTime,
          });

          // Update storage for popup
          updateActiveTrackingStorage();
        } else {
          // Session doesn't exist, create one from update data
          const newSession: TrackingSession = {
            tabId: sender.tab.id,
            mediaInfo: {
              platform: updateData.platform || "unknown",
              type: updateData.type || "video",
              title: updateData.title || "Unknown",
              url: updateData.url || "",
              progress: updateData.progress || 0,
              duration: updateData.duration || 0,
              thumbnail: updateData.thumbnail || "",
              timestamp: Date.now(),
            },
            startTime: updateData.startTime || Date.now(),
            watchTime: updateData.watchTime || 0,
            completed: updateData.completed || false,
          };
          activeSessions.set(sender.tab.id, newSession);
          console.log(
            "[Trex] Created new session from update:",
            newSession.mediaInfo.title
          );
          updateActiveTrackingStorage();
        }
      }
      sendResponse({ success: true });
      return true;

    case "TRACKING_END":
      if (sender.tab?.id) {
        const session = activeSessions.get(sender.tab.id);
        if (session) {
          console.log("[Trex] Tracking ended:", {
            title: session.mediaInfo.title,
            totalWatchTime: message.data?.watchTime || session.watchTime,
          });
          activeSessions.delete(sender.tab.id);
          updateActiveTrackingStorage();
        }
      }
      sendResponse({ success: true });
      return true;

    case "MEDIA_COMPLETED":
      console.log("[Trex] Media completed!", message.data);

      // Store pending completion
      chrome.storage.local.get(["pendingCompletions"], (result) => {
        const pending = result.pendingCompletions || [];
        pending.push({
          ...message.data,
          detectedAt: new Date().toISOString(),
        });
        chrome.storage.local.set({ pendingCompletions: pending });
      });

      // Show notification
      chrome.storage.local.get(["notificationsEnabled"], (result) => {
        if (result.notificationsEnabled !== false) {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon128.png",
            title: "Media Completed! 🎉",
            message: `You finished "${message.data.title}". Mint an NFT to record your achievement!`,
            priority: 2,
          });
        }
      });

      // Update badge
      chrome.action.setBadgeText({ text: "!" });
      chrome.action.setBadgeBackgroundColor({ color: "#00d4ff" });

      sendResponse({ success: true });
      return true;

    case "OPEN_MINT_MODAL":
      // Store the media to mint and open extension popup
      chrome.storage.local.set({ pendingMint: message.data }, () => {
        chrome.action.setPopup({ popup: `index.html#/mint` });
        chrome.action.openPopup();
      });
      sendResponse({ success: true });
      return true;

    // Get pending completions
    case "GET_PENDING_COMPLETIONS":
      chrome.storage.local.get(["pendingCompletions"], (result) => {
        sendResponse({ success: true, data: result.pendingCompletions || [] });
      });
      return true;

    case "CLEAR_PENDING_COMPLETIONS":
      chrome.storage.local.remove(["pendingCompletions"], () => {
        chrome.action.setBadgeText({ text: "" });
        sendResponse({ success: true });
      });
      return true;

    // Settings
    case "GET_SETTINGS":
      chrome.storage.local.get(
        ["trackingEnabled", "notificationsEnabled"],
        (result) => {
          sendResponse({
            success: true,
            data: {
              trackingEnabled: result.trackingEnabled ?? true,
              notificationsEnabled: result.notificationsEnabled ?? true,
            },
          });
        }
      );
      return true;

    case "UPDATE_SETTINGS":
      chrome.storage.local.set(message.data, () => {
        sendResponse({ success: true });
      });
      return true;

    // Active sessions
    case "GET_ACTIVE_SESSIONS": {
      const sessions = Array.from(activeSessions.values());
      sendResponse({ success: true, data: sessions });
      return true;
    }

    // Series bookmarks
    case "ADD_SERIES_BOOKMARK":
      chrome.storage.local.get(["seriesBookmarks"], (result) => {
        const list = result.seriesBookmarks || [];
        const entry = {
          ...message.data,
          lastChecked: new Date().toISOString(),
          hasUpdate: false,
        };
        chrome.storage.local.set({ seriesBookmarks: [...list, entry] }, () => {
          sendResponse({ success: true });
        });
      });
      return true;

    case "CHECK_SERIES_UPDATES":
      chrome.storage.local.get(["seriesBookmarks"], async (result) => {
        const list = (result.seriesBookmarks || []) as Array<any>;
        const updated: Array<any> = [];
        let updates = 0;
        for (const b of list) {
          let hasUpdate = false;
          let latestEpisode: string | undefined;
          try {
            const res = await fetch(b.url, { method: "GET" });
            if (res.ok) {
              const text = await res.text();
              const host = (() => {
                try {
                  return new URL(b.url).hostname;
                } catch {
                  return "";
                }
              })();

              const nums = Array.from(
                text.matchAll(
                  /(?:Episode|Ep\.|Chapter|Ch\.)\s*(\d+(?:\.\d+)?)/gi
                )
              ).map((m) => m[1]);
              if (nums.length)
                latestEpisode = nums.sort(
                  (a, b) => parseFloat(b) - parseFloat(a)
                )[0];

              if (/webtoons\.com/i.test(host)) {
                // webtoons: presence of episode links indicates potential updates
                hasUpdate =
                  !!latestEpisode &&
                  (!b.currentChapter ||
                    parseFloat(latestEpisode) > parseFloat(b.currentChapter));
              } else if (/mangadex\.org/i.test(host)) {
                hasUpdate =
                  !!latestEpisode &&
                  (!b.currentChapter ||
                    parseFloat(latestEpisode) > parseFloat(b.currentChapter));
              } else if (/manganato|mangakakalot|manganelo/i.test(host)) {
                hasUpdate =
                  !!latestEpisode &&
                  (!b.currentChapter ||
                    parseFloat(latestEpisode) > parseFloat(b.currentChapter));
              } else {
                // generic
                hasUpdate =
                  !!latestEpisode &&
                  (!b.currentChapter ||
                    parseFloat(latestEpisode) > parseFloat(b.currentChapter));
              }
            }
          } catch (e) {
            console.warn("[Trex] series check failed", e);
          }
          if (hasUpdate) updates++;
          updated.push({
            ...b,
            hasUpdate,
            latestEpisode,
            lastChecked: new Date().toISOString(),
          });
        }
        chrome.storage.local.set({ seriesBookmarks: updated }, () => {
          if (updates > 0) {
            chrome.action.setBadgeText({ text: "NEW" });
            chrome.action.setBadgeBackgroundColor({ color: "#7c3aed" });
            chrome.notifications.create({
              type: "basic",
              iconUrl: "icons/icon128.png",
              title: "Series Updates",
              message: `${updates} series may have new chapters`,
              priority: 1,
            });
          }
          sendResponse({ success: true, count: updated.length });
        });
      });
      return true;

    case "MARK_ALL_SERIES_READ":
      chrome.storage.local.get(["seriesBookmarks"], (result) => {
        const list = (result.seriesBookmarks || []) as Array<any>;
        const updated = list.map((b) => ({
          ...b,
          currentChapter: b.latestEpisode || b.currentChapter,
          hasUpdate: false,
        }));
        chrome.storage.local.set({ seriesBookmarks: updated }, () => {
          chrome.action.setBadgeText({ text: "" });
          sendResponse({ success: true });
        });
      });
      return true;

    default:
      sendResponse({ success: false, error: "Unknown message type" });
  }
});

// Update extension badge with completion count
function updateBadge(count: number) {
  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: "#7c3aed" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

// Update active tracking in chrome.storage for popup access
function updateActiveTrackingStorage() {
  const sessions = Array.from(activeSessions.values());
  console.log(
    "[Trex SW] Updating storage with",
    sessions.length,
    "active sessions"
  );

  // Deduplicate by URL (same video on different tabs shouldn't create duplicates)
  const uniqueSessions = new Map<string, (typeof sessions)[0]>();
  for (const session of sessions) {
    const existingSession = uniqueSessions.get(session.mediaInfo.url);
    if (!existingSession || session.watchTime > existingSession.watchTime) {
      uniqueSessions.set(session.mediaInfo.url, session);
    }
  }

  const trackingData = Array.from(uniqueSessions.values()).map((session) => ({
    id: `track-${session.tabId}-${session.startTime}`,
    platform: session.mediaInfo.platform,
    type: session.mediaInfo.type,
    title: session.mediaInfo.title,
    url: session.mediaInfo.url,
    progress: session.mediaInfo.progress || 0,
    duration: session.mediaInfo.duration || 0,
    watchTime: Math.round(session.watchTime),
    thumbnail: session.mediaInfo.thumbnail || "",
    completed: session.completed,
    startTime: session.startTime,
    lastUpdate: Date.now(),
  }));

  console.log("[Trex SW] Saving tracking data to storage:", trackingData);

  chrome.storage.local.set({ activeTracking: trackingData }, () => {
    if (chrome.runtime.lastError) {
      console.error(
        "[Trex SW] Error saving tracking data:",
        chrome.runtime.lastError
      );
    } else {
      console.log(
        "[Trex SW] Updated active tracking storage:",
        trackingData.length,
        "sessions"
      );
    }
  });
}

// Handle tab updates (when URL changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    // Session will be managed by content script
    console.log("[Trex] Tab updated:", tabId);
  }
});

// Handle tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeSessions.has(tabId)) {
    console.log("[Trex] Tab closed, ending session:", tabId);
    activeSessions.delete(tabId);
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener(() => {
  chrome.action.openPopup();
});

// Scheduler: periodically check series updates
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("check-series-updates", { periodInMinutes: 60 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "check-series-updates") {
    chrome.runtime.sendMessage({ type: "CHECK_SERIES_UPDATES" });
  }
});

export {};

// ==========================================
// Dynamic Content Script Injection
// ==========================================

// Get content script path from manifest (built JS files, not TS source)
function getContentScriptPath(): string {
  const manifest = chrome.runtime.getManifest();
  const scripts = manifest.content_scripts?.[0]?.js || [];
  // The manifest contains the built .js paths after vite build
  return scripts[0] || "src/content/media-tracker.js";
}

// Register content scripts for granted origins
async function registerDynamicContentScripts(origins: string[]) {
  if (!origins.length) {
    console.log("[Trex] No origins to register");
    return;
  }

  const scriptPath = getContentScriptPath();
  console.log("[Trex] Registering content scripts for:", origins);
  console.log("[Trex] Using script path:", scriptPath);

  try {
    // First, try to unregister existing scripts to avoid conflicts
    try {
      await chrome.scripting.unregisterContentScripts({
        ids: ["trex-dynamic"],
      });
      console.log("[Trex] Unregistered existing dynamic script");
    } catch {
      // Ignore - script may not exist
    }

    // Register new content scripts
    await chrome.scripting.registerContentScripts([
      {
        id: "trex-dynamic",
        matches: origins,
        js: [scriptPath],
        runAt: "document_idle",
        allFrames: false,
        persistAcrossSessions: true,
      },
    ]);
    console.log(
      "[Trex] Content scripts registered successfully for",
      origins.length,
      "origins"
    );
  } catch (error) {
    console.error("[Trex] Failed to register content scripts:", error);
    // Try to get more details about the error
    if (error instanceof Error) {
      console.error("[Trex] Error details:", error.message);
    }
  }
}

// Inject content script into a specific tab
async function injectContentScript(tabId: number, forceInject = false) {
  const scriptPath = getContentScriptPath();
  console.log("[Trex] Attempting to inject content script into tab:", tabId);

  if (!forceInject) {
    try {
      // Check if script is already injected by sending a ping
      const results = await chrome.tabs
        .sendMessage(tabId, { type: "PING" })
        .catch(() => null);
      if (results) {
        console.log(
          "[Trex] Content script already active in tab:",
          tabId,
          results
        );
        // Tell it to re-initialize tracking
        chrome.tabs.sendMessage(tabId, { type: "REINITIALIZE" });
        return true;
      }
    } catch {
      // Script not injected yet, continue
      console.log("[Trex] No response from content script, will inject");
    }
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [scriptPath],
    });
    console.log("[Trex] Content script injected successfully into tab:", tabId);
    return true;
  } catch (error) {
    console.warn("[Trex] Failed to inject content script:", error);
    if (error instanceof Error) {
      console.warn("[Trex] Injection error details:", error.message);
    }
    return false;
  }
}

// Initialize content scripts on startup
chrome.permissions.getAll().then((permissions) => {
  const origins = permissions.origins || [];
  console.log("[Trex] Startup - current permissions:", origins);
  if (origins.length > 0) {
    registerDynamicContentScripts(origins);
  }
});

console.log("[Trex] Service worker loaded");

// Handle new permissions being granted
chrome.permissions.onAdded.addListener(async (permissions) => {
  const origins = permissions.origins || [];
  console.log("[Trex] New permissions granted:", origins);

  if (origins.length > 0) {
    // Get all current permissions and register scripts for future page loads
    const allPermissions = await chrome.permissions.getAll();
    console.log("[Trex] All permissions:", allPermissions.origins);
    await registerDynamicContentScripts(allPermissions.origins || []);

    // Inject into ALL tabs that match the new origins immediately
    const allTabs = await chrome.tabs.query({});
    console.log("[Trex] Checking", allTabs.length, "tabs for injection");

    for (const tab of allTabs) {
      if (tab.id && tab.url && !tab.url.startsWith("chrome://")) {
        // Check if the tab URL matches any of the new origins
        const matches = origins.some((origin) => {
          // Convert pattern like https://*.example.com/* to regex
          const pattern = origin
            .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // Escape special regex chars first
            .replace(/\\\*/g, ".*"); // Then convert * to .*
          try {
            return new RegExp(`^${pattern}$`).test(tab.url || "");
          } catch {
            // Fallback: simple includes check
            const domain = origin
              .replace(/https?:\/\/\*?\.?/, "")
              .replace(/\/\*$/, "");
            return (tab.url || "").includes(domain);
          }
        });

        if (matches) {
          console.log("[Trex] Tab matches new permission, injecting:", tab.url);
          await injectContentScript(tab.id, true); // Force inject
        }
      }
    }
  }
});

// Handle permissions being removed
chrome.permissions.onRemoved.addListener(async () => {
  console.log("[Trex] Permissions removed, updating content scripts");
  try {
    await chrome.scripting.unregisterContentScripts({ ids: ["trex-dynamic"] });
  } catch {
    // Ignore
  }

  // Re-register with remaining permissions
  const permissions = await chrome.permissions.getAll();
  if (permissions.origins && permissions.origins.length > 0) {
    await registerDynamicContentScripts(permissions.origins);
  }
});

// Handle tab updates - inject script if needed
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    !tab.url.startsWith("chrome://")
  ) {
    try {
      const url = new URL(tab.url);
      // Try multiple permission patterns
      const patterns = [
        url.origin + "/*",
        `https://*.${url.hostname.replace(/^www\./, "")}/*`,
        `https://${url.hostname}/*`,
      ];

      let hasPermission = false;
      for (const pattern of patterns) {
        try {
          hasPermission = await chrome.permissions.contains({
            origins: [pattern],
          });
          if (hasPermission) {
            console.log("[Trex] Tab has permission via pattern:", pattern);
            break;
          }
        } catch {
          // Pattern may be invalid, try next
        }
      }

      if (hasPermission) {
        // Small delay to ensure page is ready
        setTimeout(() => {
          console.log(
            "[Trex] Injecting content script on tab update:",
            tab.url
          );
          injectContentScript(tabId);
        }, 500);
      }
    } catch (e) {
      console.warn("[Trex] Error checking tab permission:", e);
    }
  }
});

// ==========================================
// Extension Bridge - Session Sync
// ==========================================

// Session storage key
const SESSION_STORAGE_KEY = "trex_session";

// Message types for bridge communication
const BRIDGE_MESSAGE_TYPES = {
  SESSION_DATA: "TREX_SESSION_DATA",
  REQUEST_SESSION: "TREX_REQUEST_SESSION",
  SESSION_RECEIVED: "TREX_SESSION_RECEIVED",
};

// Handle connections from content scripts
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "trex-bridge") return;

  console.log("[Trex Bridge] Content script connected");

  // Listen for messages from content script
  port.onMessage.addListener((message) => {
    if (message.type === BRIDGE_MESSAGE_TYPES.SESSION_DATA) {
      // Save session to chrome.storage
      chrome.storage.local.set({
        [SESSION_STORAGE_KEY]: message.data,
      });
      console.log("[Trex Bridge] Session saved from content script");
    }
  });

  // Send current session to newly connected content script
  chrome.storage.local.get([SESSION_STORAGE_KEY], (result) => {
    if (result[SESSION_STORAGE_KEY]) {
      port.postMessage({
        type: BRIDGE_MESSAGE_TYPES.SESSION_DATA,
        data: result[SESSION_STORAGE_KEY],
      });
    }
  });
});

// Handle external messages from web app (requires externally_connectable in manifest)
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    console.log("[Trex Bridge] External message from:", sender.url);

    // Handle WALLET_CONNECTED from localhost auth page
    if (request.type === "WALLET_CONNECTED" && request.session) {
      console.log(
        "[Trex Bridge] Wallet connected from localhost:",
        request.session
      );
      chrome.storage.local.set({
        trex_wallet_session: request.session,
        trex_wallet_connected: true,
      });

      // Notify any open extension popup to refresh
      chrome.runtime
        .sendMessage({
          type: "WALLET_SESSION_UPDATED",
          session: request.session,
        })
        .catch(() => {
          // Ignore error if popup is not open
        });

      sendResponse({ success: true });
      return;
    }

    // Handle WALLET_DISCONNECTED from localhost
    if (request.type === "WALLET_DISCONNECTED") {
      console.log("[Trex Bridge] Wallet disconnected from localhost");
      chrome.storage.local.remove([
        "trex_wallet_session",
        "trex_wallet_connected",
      ]);

      // Notify any open extension popup
      chrome.runtime
        .sendMessage({
          type: "WALLET_SESSION_CLEARED",
        })
        .catch(() => {
          // Ignore error if popup is not open
        });

      sendResponse({ success: true });
      return;
    }

    // Handle SESSION_SYNC from web app
    if (request.type === "SESSION_SYNC" && request.source === "trex-web") {
      console.log("[Trex Bridge] Received session sync from web app");
      chrome.storage.local.set({
        [SESSION_STORAGE_KEY]: request.data,
      });

      // Notify any open extension popup to refresh
      chrome.runtime
        .sendMessage({
          type: "SESSION_UPDATED",
          data: request.data,
        })
        .catch(() => {
          // Ignore error if popup is not open
        });

      sendResponse({ success: true });
      return;
    }

    if (request.type === BRIDGE_MESSAGE_TYPES.SESSION_DATA) {
      // Save session to chrome.storage
      chrome.storage.local.set({
        [SESSION_STORAGE_KEY]: request.data,
      });
      sendResponse({ success: true });
      return;
    }

    if (request.type === BRIDGE_MESSAGE_TYPES.REQUEST_SESSION) {
      // Return session data
      chrome.storage.local.get([SESSION_STORAGE_KEY], (result) => {
        sendResponse({
          success: true,
          data: result[SESSION_STORAGE_KEY] || null,
        });
      });
      return true; // Keep message channel open for async response
    }
  }
);

console.log("[Trex Bridge] Background bridge initialized");
