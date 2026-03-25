import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/lib/i18n'  // initialise i18next before rendering

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
