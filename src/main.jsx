import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { BlogDataContext } from './hooks/useBlogData.js'
import App from './App.jsx'
import './styles/global.css'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')
const rootEl = document.getElementById('root')
const dataEl = document.getElementById('__BLOG_DATA__')

function AppShell({ data }) {
  return (
    <StrictMode>
      <BrowserRouter basename={basename}>
        <BlogDataContext.Provider value={data}>
          <App />
        </BlogDataContext.Provider>
      </BrowserRouter>
    </StrictMode>
  )
}

if (dataEl) {
  // 生产 SSG: 水合已有 HTML
  const data = JSON.parse(dataEl.textContent)
  hydrateRoot(rootEl, <AppShell data={data} />)
} else {
  // Dev SPA: 直接创建
  import('../content/posts/posts.json').then(module => {
    createRoot(rootEl).render(<AppShell data={{ posts: module.default }} />)
  })
}
