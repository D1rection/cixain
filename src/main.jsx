import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { BlogDataContext } from './hooks/useBlogData.js'
import App from './App.jsx'
import posts from '../content/posts/posts.json'
import './styles/global.css'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <BlogDataContext.Provider value={{ posts }}>
        <App />
      </BlogDataContext.Provider>
    </BrowserRouter>
  </StrictMode>,
)
