import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useBlogData } from '../hooks/useBlogData.js'
import PostContent from '../components/PostContent.jsx'
import InteractiveWrapper from '../components/InteractiveWrapper.jsx'

function readData(slug) {
  if (typeof document === 'undefined') return null
  const el = document.getElementById('__BLOG_DATA__')
  if (!el) return null
  const data = JSON.parse(el.textContent)
  const meta = data.post || data.posts?.find(p => p.slug === slug)
  const html = data.postContent || meta?.postContent
  return meta ? { meta, html } : null
}

export default function BlogPost() {
  const { slug } = useParams()
  const { posts = [], post, postContent: ssgContent } = useBlogData()

  // SSR: 从 context 同步获取
  const ssrMeta = post || posts.find(p => p.slug === slug)
  const ssrHtml = ssgContent || ssrMeta?.postContent

  const [result, setResult] = useState(() => readData(slug) || (ssrMeta ? { meta: ssrMeta, html: ssrHtml } : null))

  useEffect(() => {
    // 已有数据且 html 可用则跳过
    if (result?.html) return

    // 有元数据但 html 未就绪（dev SPA）
    if (result?.meta) {
      fetch(`/content/posts/${slug}.html`)
        .then(r => r.ok ? r.text() : Promise.reject())
        .then(html => setResult({ meta: result.meta, html }))
        .catch(() => setResult({ meta: null }))
      return
    }

    // 尝试从 __BLOG_DATA__ 读
    const fromDom = readData(slug)
    if (fromDom) { setResult(fromDom); return }

    // Dev SPA fallback
    const meta = posts.find(p => p.slug === slug)
    if (!meta) { setResult({ meta: null }); return }

    fetch(`/content/posts/${slug}.html`)
      .then(r => r.ok ? r.text() : Promise.reject())
      .then(html => setResult({ meta, html }))
      .catch(() => setResult({ meta: null }))
  }, [slug])

  if (!result || !result.meta) {
    return (
      <main style={{ maxWidth: 680, margin: '0 auto', padding: 48, textAlign: 'center' }}>
        <h1>文章未找到</h1>
        <p style={{ color: '#6b7280', marginTop: 8 }}>slug: {slug}</p>
      </main>
    )
  }

  return (
    <article>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px 0' }}>
        <h1>{result.meta.title}</h1>
        <p style={{ color: '#6b7280', marginTop: 8 }}>
          {new Date(result.meta.date).toLocaleDateString('zh-CN')}
          {result.meta.category && ` · ${result.meta.category}`}
        </p>
      </div>
      <PostContent html={result.html} />
      <InteractiveWrapper />
    </article>
  )
}
