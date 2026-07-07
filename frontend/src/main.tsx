import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { queryClient } from './lib/queryClient'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          gutter={10}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(17, 24, 39, 0.92)',
              backdropFilter: 'blur(8px)',
              color: '#e2e8f0',
              border: '1px solid #1e2a3a',
              borderRadius: '12px',
              padding: '12px 14px',
              fontSize: '13px',
              fontWeight: 500,
              lineHeight: '1.4',
              maxWidth: '380px',
              boxShadow: '0 12px 32px -12px rgba(0, 0, 0, 0.7)',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#0d1117' },
              style: { border: '1px solid rgba(34, 197, 94, 0.35)' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#0d1117' },
              style: { border: '1px solid rgba(248, 113, 113, 0.35)' },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
)
