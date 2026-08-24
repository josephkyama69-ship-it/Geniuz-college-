
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for Offline-First PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Only bypass if we are strictly inside the embedded editor iframe (window.self !== window.top)
    // to prevent caching issues during active development. If opened in a new tab or shared preview,
    // we want full offline service worker caching to be active!
    const isInsideIframe = window.self !== window.top;

    if (isInsideIframe) {
      console.log('[PWA] Service Worker registration bypassed inside the development iframe.');
      return;
    }

    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('[PWA] Service Worker registered in scope:', reg.scope);
      })
      .catch(err => {
        console.warn('[PWA] Service Worker registration bypassed or failed:', err);
      });
  });
}

