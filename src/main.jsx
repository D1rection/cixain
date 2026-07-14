import { createRoot, hydrateRoot } from 'react-dom/client'
// ── 全局点击委派 ──
const actions = {
  async copy(el) {
    const pre = el.closest('pre')
    if (!pre) return
    const code = pre.querySelector('code')
    if (!code) return
    try {
      await navigator.clipboard.writeText(code.textContent)
      el.textContent = '已复制'
      setTimeout(() => { el.textContent = '复制' }, 1500)
    } catch {}
  },
  preview(el, e) {
    e.preventDefault()
    const src = el.getAttribute('href') || el.querySelector('img')?.src
    if (!src) return
    const group = el.getAttribute('data-fslightbox') || ''
    const all = document.querySelectorAll(`[data-fslightbox="${CSS.escape(group)}"]`)
    const images = Array.from(all).map(a => a.getAttribute('href') || a.querySelector('img')?.src).filter(Boolean)
    const index = Math.max(0, images.indexOf(src))
    window.dispatchEvent(new CustomEvent('open-preview', { detail: { images, index } }))
  },
}

document.addEventListener('click', (e) => {
  const origin = e.target.closest('[data-action]')
  if (!origin) return
  actions[origin.dataset.action]?.(origin, e)
})

import { Router } from 'wouter'
import { BlogDataContext } from './hooks/useBlogData.js'
import App from './App.jsx'
import './styles/global.css'

/**
 * 浏览器入口
 * - SSG 模式: __BLOG_DATA__ 存在 → hydrateRoot 水合已有 HTML
 * - Dev SPA 模式: 不存在 → createRoot + import posts.json
 */

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
  const pageName = location.pathname.replace(/^\//, '').replace(/\/$/, '') || '/'
  const pageLoader = pageName !== '/'
    ? import('../content/pages/pages.json').then(m => ({ pageContent: m.default[pageName] || '' }))
    : Promise.resolve({})

  import('../content/posts/posts.json').then(postsModule =>
    pageLoader.then(pageData =>
      createRoot(rootEl).render(
        <AppShell data={{ posts: postsModule.default, ...pageData }} />
      )
    )
  )
}
