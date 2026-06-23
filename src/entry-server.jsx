import { renderToString } from 'react-dom/server'
import { Router } from 'wouter'
import { BlogDataContext } from './hooks/useBlogData.js'
import App from './App.jsx'

/**
 * SSR 渲染入口
 * @param {string} url 路由路径
 * @param {Object} data __BLOG_DATA__ 数据
 * @returns {string} 渲染后的 HTML 字符串
 */
export function render(url, data) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  // ssrPath 需要包含 base 前缀，wouter internal 会去掉 base 来匹配路由
  const ssrPath = base ? `${base}${url === '/' ? '' : url}` : url

  return renderToString(
    <Router ssrPath={ssrPath} base={base}>
      <BlogDataContext.Provider value={data}>
        <App />
      </BlogDataContext.Provider>
    </Router>,
  )
}
