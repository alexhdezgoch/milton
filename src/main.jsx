import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import PrivacyPolicy from './components/PrivacyPolicy.jsx'
import ArticlePage from './components/ArticlePage.jsx'
import ArticleIndexPage from './components/ArticleIndexPage.jsx'
import './index.css'

// Simple routing for static pages
function Root() {
  const path = window.location.pathname

  if (path === '/privacy') {
    return <PrivacyPolicy />
  }

  // Blog index
  if (path === '/blog') {
    return <ArticleIndexPage routeType="blog" onGetStarted={() => window.location.href = '/'} />
  }

  // VS (comparison) index
  if (path === '/vs') {
    return <ArticleIndexPage routeType="vs" onGetStarted={() => window.location.href = '/'} />
  }

  // For (use cases) index
  if (path === '/for') {
    return <ArticleIndexPage routeType="for" onGetStarted={() => window.location.href = '/'} />
  }

  // Blog post: /blog/[slug]
  const blogMatch = path.match(/^\/blog\/([^/]+)$/)
  if (blogMatch) {
    return <ArticlePage slug={blogMatch[1]} routeType="blog" onGetStarted={() => window.location.href = '/'} />
  }

  // Comparison page: /vs/[slug]
  const vsMatch = path.match(/^\/vs\/([^/]+)$/)
  if (vsMatch) {
    return <ArticlePage slug={vsMatch[1]} routeType="vs" onGetStarted={() => window.location.href = '/'} />
  }

  // Use case page: /for/[slug]
  const forMatch = path.match(/^\/for\/([^/]+)$/)
  if (forMatch) {
    return <ArticlePage slug={forMatch[1]} routeType="for" onGetStarted={() => window.location.href = '/'} />
  }

  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Root />,
)
