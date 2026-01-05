/**
 * Extension Auth Bridge
 *
 * Handles wallet connection for Chrome extensions by redirecting to localhost
 * web app for authentication, then receiving the session back via messaging.
 *
 * Flow:
 * 1. Extension clicks "Connect Wallet"
 * 2. Opens localhost:5173/auth in new tab
 * 3. User connects wallet on localhost (where csprclick-template works)
 * 4. Localhost sends session data back to extension via chrome.runtime.sendMessage
 * 5. Extension stores session and updates UI
 */

// Storage keys for wallet session
export const WALLET_SESSION_KEY = "trex_wallet_session";
export const WALLET_CONNECTED_KEY = "trex_wallet_connected";

export interface WalletSession {
  address: string;
  publicKey: string;
  network: string;
  provider?: string;
  connectedAt: number;
}

// Check if running as extension
export const isExtension = (): boolean => {
  return (
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    chrome.runtime.id !== undefined
  );
};

// Get the extension ID (for messaging)
export const getExtensionId = (): string | null => {
  if (!isExtension()) return null;
  return chrome.runtime.id;
};

// Open localhost auth page in new tab
export const openAuthPage = (): void => {
  // Use hash router format: localhost:5173/#/auth
  const authUrl = `http://localhost:5173/#/auth?extensionId=${getExtensionId()}`;

  if (isExtension()) {
    chrome.tabs.create({ url: authUrl });
  } else {
    window.open(authUrl, "_blank");
  }
};

// Save wallet session to storage
export const saveWalletSession = async (
  session: WalletSession
): Promise<void> => {
  if (isExtension()) {
    await chrome.storage.local.set({
      [WALLET_SESSION_KEY]: session,
      [WALLET_CONNECTED_KEY]: true,
    });
  } else {
    localStorage.setItem(WALLET_SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(WALLET_CONNECTED_KEY, "true");
  }
};

// Get wallet session from storage
export const getWalletSession = async (): Promise<WalletSession | null> => {
  if (isExtension()) {
    const result = await chrome.storage.local.get([
      WALLET_SESSION_KEY,
      WALLET_CONNECTED_KEY,
    ]);
    if (result[WALLET_CONNECTED_KEY] && result[WALLET_SESSION_KEY]) {
      return result[WALLET_SESSION_KEY] as WalletSession;
    }
    return null;
  } else {
    const connected = localStorage.getItem(WALLET_CONNECTED_KEY);
    const session = localStorage.getItem(WALLET_SESSION_KEY);
    if (connected === "true" && session) {
      return JSON.parse(session) as WalletSession;
    }
    return null;
  }
};

// Clear wallet session
export const clearWalletSession = async (): Promise<void> => {
  if (isExtension()) {
    await chrome.storage.local.remove([
      WALLET_SESSION_KEY,
      WALLET_CONNECTED_KEY,
    ]);
  } else {
    localStorage.removeItem(WALLET_SESSION_KEY);
    localStorage.removeItem(WALLET_CONNECTED_KEY);
  }
};

// Listen for wallet connection messages (in extension background)
export const setupAuthListener = (
  onConnect: (session: WalletSession) => void
): void => {
  if (!isExtension()) return;

  chrome.runtime.onMessageExternal.addListener(
    (message, _sender, sendResponse) => {
      if (message.type === "WALLET_CONNECTED" && message.session) {
        console.log(
          "[Extension Auth] Received wallet session from localhost:",
          message.session
        );
        saveWalletSession(message.session).then(() => {
          onConnect(message.session);
          sendResponse({ success: true });
        });
        return true; // Keep channel open for async response
      }

      if (message.type === "WALLET_DISCONNECTED") {
        console.log("[Extension Auth] Wallet disconnected from localhost");
        clearWalletSession().then(() => {
          sendResponse({ success: true });
        });
        return true;
      }
    }
  );
};

// Send wallet connection to extension (from localhost web app)
// Uses window.postMessage to communicate with content script injected by extension
export const sendSessionToExtension = async (
  _extensionId: string,
  session: WalletSession
): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log("[Auth Bridge] Sending session via postMessage:", session);

    // Set up listener for acknowledgment from content script
    const handleResponse = (event: MessageEvent) => {
      if (event.source !== window) return;
      const message = event.data;
      if (
        message &&
        message.source === "trex-extension" &&
        message.type === "WALLET_CONNECTED_ACK"
      ) {
        console.log("[Auth Bridge] Received ACK from extension:", message);
        window.removeEventListener("message", handleResponse);
        resolve(message.success ?? true);
      }
    };

    window.addEventListener("message", handleResponse);

    // Send message to content script via window.postMessage
    window.postMessage(
      {
        type: "WALLET_CONNECTED",
        source: "trex-web",
        session: session,
      },
      "*"
    );

    // Timeout after 5 seconds if no response
    setTimeout(() => {
      window.removeEventListener("message", handleResponse);
      console.log("[Auth Bridge] Timeout waiting for extension response");
      // Still resolve true since the message was sent - extension might not be listening
      resolve(true);
    }, 5000);
  });
};

// Notify extension of disconnect
export const notifyExtensionDisconnect = async (
  _extensionId: string
): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log("[Auth Bridge] Sending disconnect via postMessage");

    // Set up listener for acknowledgment
    const handleResponse = (event: MessageEvent) => {
      if (event.source !== window) return;
      const message = event.data;
      if (
        message &&
        message.source === "trex-extension" &&
        message.type === "WALLET_DISCONNECTED_ACK"
      ) {
        window.removeEventListener("message", handleResponse);
        resolve(message.success ?? true);
      }
    };

    window.addEventListener("message", handleResponse);

    // Send disconnect message
    window.postMessage(
      {
        type: "WALLET_DISCONNECTED",
        source: "trex-web",
      },
      "*"
    );

    // Timeout after 3 seconds
    setTimeout(() => {
      window.removeEventListener("message", handleResponse);
      resolve(true);
    }, 3000);
  });
};
