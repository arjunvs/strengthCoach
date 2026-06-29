import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* ignore offline-only failures */ });
  });
}

// Apply dark mode from stored settings
const settings = (() => {
  try { return JSON.parse(localStorage.getItem('sc_settings') ?? '{}'); } catch { return {}; }
})();
if (settings.darkMode) document.documentElement.classList.add('dark');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
