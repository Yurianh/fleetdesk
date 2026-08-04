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
import '@/index.css'
import '@/lib/i18n'  // initialise i18next before rendering

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
