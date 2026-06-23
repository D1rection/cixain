import { createRoot, hydrateRoot } from 'react-dom/client'
import { Router } from 'wouter'
import { BlogDataContext } from './hooks/useBlogData.js'
import App from './App.jsx'
import './styles/global.css'

const rootEl = document.getElementById('root')
const dataEl = document.getElementById('__BLOG_DATA__')

const base = import.meta.env.BASE_URL.replace(/\/$/, '')

function AppShell({ data }) {
  return (
    <Router base={base}>
      <BlogDataContext.Provider value={data}>
        <App />
      </BlogDataContext.Provider>
    </Router>
  )
}

if (dataEl) {
  const data = JSON.parse(dataEl.textContent)
  hydrateRoot(rootEl, <AppShell data={data} />)
} else {
  import('../content/posts/posts.json').then(module => {
    createRoot(rootEl).render(<AppShell data={{ posts: module.default }} />)
  })
}
