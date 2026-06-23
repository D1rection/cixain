import { hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { BlogDataContext } from './hooks/useBlogData.js'
import App from './App.jsx'
import './styles/global.css'

const data = JSON.parse(document.getElementById('__BLOG_DATA__').textContent)
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

hydrateRoot(
  document.getElementById('root'),
  <BrowserRouter basename={basename}>
    <BlogDataContext.Provider value={data}>
      <App />
    </BlogDataContext.Provider>
  </BrowserRouter>,
)
