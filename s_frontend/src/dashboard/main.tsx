import React from 'react';
import ReactDOM from 'react-dom/client';
import { DashboardApp } from './App';
import '@/styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DashboardApp />
  </React.StrictMode>
);

