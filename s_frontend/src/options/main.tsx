import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrivacySettings } from '@/components/PrivacySettings';
import '@/styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="min-h-screen bg-gray-50 py-8">
      <PrivacySettings />
    </div>
  </React.StrictMode>
);

