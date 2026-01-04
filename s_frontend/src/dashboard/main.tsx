import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "styled-components";
import { ClickProvider, ClickUI } from "@make-software/csprclick-ui";
import { CONTENT_MODE } from "@make-software/csprclick-core-types";
import type { CsprClickInitOptions } from "@make-software/csprclick-core-types";
import { CsprClickThemes } from "@make-software/csprclick-ui";
import App from "./App";
import "@/styles/globals.css";

// CSPR Click SDK Configuration
// Note: 'csprclick-template' is valid for localhost development only
// Get your own appId from console.cspr.build before deploying to production
const clickOptions: CsprClickInitOptions = {
  appName: "Trex",
  appId: "csprclick-template",
  contentMode: CONTENT_MODE.IFRAME,
  providers: ["casper-wallet", "ledger", "casper-signer"],
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={CsprClickThemes.dark}>
      <ClickProvider options={clickOptions}>
        <ClickUI />
        <App />
      </ClickProvider>
    </ThemeProvider>
  </React.StrictMode>
);
