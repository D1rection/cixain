import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { BlogDataContext } from './hooks/useBlogData.js'
import App from './App.jsx'

export function render(url, data) {
  const html = renderToString(
    <MemoryRouter initialEntries={[url]}>
      <BlogDataContext.Provider value={data}>
        <App />
      </BlogDataContext.Provider>
    </MemoryRouter>,
  )
  return html
}
