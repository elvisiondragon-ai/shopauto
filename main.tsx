import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from './components/ui/toaster'
import ShopAuto from './shopauto'
import { Auth } from './components/Auth'
import './index.css'

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
