import React, { useEffect, useState, ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ClickProvider as CsprClickProvider,
  ClickUI,
} from "@make-software/csprclick-ui";
import {
  CsprClickInitOptions,
  CONTENT_MODE,
} from "@make-software/csprclick-core-types";
import { ThemeProvider } from "styled-components";
import { CsprClickThemes } from "@make-software/csprclick-ui";
import { CsprClickContext } from "@/hooks/useCsprClick";

// Detect if running as extension (popup window is smaller)
const isExtension =
  typeof chrome !== "undefined" &&
  chrome.runtime &&
  chrome.runtime.id !== undefined;

// Local SDK path - bundled to bypass CSP restrictions from CDN
// The SDK is downloaded from cdn.cspr.click/latest/csprclick-sdk-1.12.js
const localSdkPath = "/csprclick-sdk-1.12.js";

// CSPR.click initialization options
// Use POPUP mode for extensions (bypasses CSP restrictions)
// Use IFRAME mode for web (better UX)
const clickOptions: CsprClickInitOptions = {
  appName: "Media NFT Tracker",
  appId: "csprclick-template",
  contentMode: isExtension ? CONTENT_MODE.POPUP : CONTENT_MODE.IFRAME,
  providers: [
    "casper-wallet",
    "ledger",
    "metamask-snap",
    "walletconnect",
    "casperdash",
  ],
  walletConnect: {
    relayUrl: "wss://relay.walletconnect.com",
    projectId: "e8e8111e46f4cd44143fe05a51b49fb8", // WalletConnect project ID from working example
  },
};

interface Props {
  children: ReactNode;
}

export const CsprClickWrapper: React.FC<Props> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Mark as initialized after SDK has time to load
    const timer = setTimeout(() => {
      setIsInitialized(true);
      console.log("[CSPR Click] SDK initialized");
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider theme={CsprClickThemes.dark}>
      <CsprClickProvider
        options={clickOptions}
        {...(isExtension ? { csprclickSdk: localSdkPath } : {})}
      >
        <CsprClickContext.Provider value={{ isInitialized }}>
          {/* ClickUI wrapped in portal to display above everything */}
          {createPortal(<ClickUI />, document.body)}
          {children}
        </CsprClickContext.Provider>
      </CsprClickProvider>
    </ThemeProvider>
  );
};
