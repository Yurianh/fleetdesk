import React from 'react'
import ReactDOM from 'react-dom/client'
// Self-hosted fonts (no Google CDN, no visitor IP sent to Google)
import '@fontsource/onest/400.css'
import '@fontsource/onest/500.css'
import '@fontsource/onest/600.css'
import '@fontsource/onest/700.css'
import '@fontsource/spectral/400.css'
import '@fontsource/spectral/500.css'
import '@fontsource/spectral/600.css'
import App from '@/App.jsx'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import '@/index.css'
import '@/lib/i18n'  // initialise i18next before rendering

// Surface uncaught errors and rejected promises to the console — visible in the
// browser and captured by Vercel logs. Kept lightweight (no external reporter).
window.addEventListener('error', (e) => {
  // eslint-disable-next-line no-console
  console.error('[window.error]', e.error || e.message)
})
window.addEventListener('unhandledrejection', (e) => {
  // eslint-disable-next-line no-console
  console.error('[unhandledrejection]', e.reason)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
