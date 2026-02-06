import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import PrivacyPolicy from './components/PrivacyPolicy.jsx'
import './index.css'

// Simple routing for static pages
function Root() {
  const path = window.location.pathname

  if (path === '/privacy') {
    return <PrivacyPolicy />
  }

  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Root />,
)
