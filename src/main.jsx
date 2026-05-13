import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const redirectHash = sessionStorage.getItem('tm-redirect');
if (redirectHash) {
  sessionStorage.removeItem('tm-redirect');
  window.location.hash = redirectHash;
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
