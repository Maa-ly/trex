import React, { useEffect, useState, ReactNode } from "react";
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

// Get configuration from environment variables
const appId = import.meta.env.VITE_CSPR_CLICK_APP_ID || "csprclick-template";
const appName = import.meta.env.VITE_CSPR_CLICK_APP_NAME || "Media NFT Tracker";
const walletConnectProjectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

// CSPR.click initialization options
const clickOptions: CsprClickInitOptions = {
  appName,
  appId,
  contentMode: CONTENT_MODE.IFRAME,
  providers: ["casper-wallet", "ledger", "metamask-snap", "casperdash"],
  ...(walletConnectProjectId && {
    walletConnect: {
      relayUrl: "wss://relay.walletconnect.com",
      projectId: walletConnectProjectId,
    },
  }),
};

interface Props {
  children: ReactNode;
}

export const CsprClickWrapper: React.FC<Props> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Mark as initialized after a short delay to ensure SDK is ready
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider theme={CsprClickThemes.dark}>
      <CsprClickProvider options={clickOptions}>
        <CsprClickContext.Provider value={{ isInitialized }}>
          {/* ClickUI manages all wallet UI - we don't use the top bar */}
          <ClickUI />
          {children}
        </CsprClickContext.Provider>
      </CsprClickProvider>
    </ThemeProvider>
  );
};
