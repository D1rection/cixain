import { hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { BlogDataContext } from './hooks/useBlogData.js'
import App from './App.jsx'
import './styles/global.css'

const data = JSON.parse(document.getElementById('__BLOG_DATA__').textContent)

hydrateRoot(
  document.getElementById('root'),
  <BrowserRouter>
    <BlogDataContext.Provider value={data}>
      <App />
    </BlogDataContext.Provider>
  </BrowserRouter>,
)
