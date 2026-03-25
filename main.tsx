import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from './components/ui/toaster'
import ShopAuto from './shopauto'
import { Auth } from './components/Auth'
import './index.css'

const APP_VERSION = '2026.03.12.01'; // WAWP API Migration

// Execute aggressive cache clearing before React mounts if versions mismatch
if (localStorage.getItem('v_cache') !== APP_VERSION) {
  // 1. Clear all Service Workers
  if ('serviceWorker' in navigator && navigator.serviceWorker) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      if (regs) regs.forEach(r => r.unregister());
    });
  }

  // 2. Clear all Browser Caches
  if ('caches' in window && window.caches) {
    caches.keys().then(names => {
      if (names) names.forEach(name => caches.delete(name));
    });
  }

  // 3. Update version and reload
  localStorage.setItem('v_cache', APP_VERSION);
  window.location.reload();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ShopAuto />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)
