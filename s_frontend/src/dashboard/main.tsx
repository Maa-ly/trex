import React from "react";
import ReactDOM from "react-dom/client";
import { DashboardApp } from "./App";
import { CsprClickWrapper } from "@/providers/CsprClickProvider";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CsprClickWrapper>
      <DashboardApp />
    </CsprClickWrapper>
  </React.StrictMode>
);
