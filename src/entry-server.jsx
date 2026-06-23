import { renderToString } from 'react-dom/server'
import { Router } from 'wouter'
import { BlogDataContext } from './hooks/useBlogData.js'
import App from './App.jsx'

export function render(url, data) {
  return renderToString(
    <Router ssrPath={url}>
      <BlogDataContext.Provider value={data}>
        <App />
      </BlogDataContext.Provider>
    </Router>,
  )
}
