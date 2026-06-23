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
    <BrowserRouter basename={basename}>
      <BlogDataContext.Provider value={data}>
        <App />
      </BlogDataContext.Provider>
    </BrowserRouter>
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
