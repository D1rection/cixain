import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useBlogData } from '../hooks/useBlogData.js'
import PostContent from '../components/PostContent.jsx'
import InteractiveWrapper from '../components/InteractiveWrapper.jsx'

function findPostData(slug) {
  // 优先从 __BLOG_DATA__ 读（生产水合状态或客户端导航共享数据）
  const el = document.getElementById('__BLOG_DATA__')
  if (el) {
    const data = JSON.parse(el.textContent)
    const meta = data.post || data.posts?.find(p => p.slug === slug)
    const html = data.postContent || meta?.postContent
    if (meta) return { meta, html }
  }
  return null
}

export default function BlogPost() {
  const { slug } = useParams()
  const [result, setResult] = useState(() => findPostData(slug))
  const { posts = [] } = useBlogData()

  useEffect(() => {
    // 客户端导航后，__BLOG_DATA__ 不会变，直接从中取数据
    const found = findPostData(slug)
    if (found) {
      setResult(found)
      return
    }

    // Dev SPA fallback: 从 context 中查找并 fetch
    const meta = posts.find(p => p.slug === slug)
    if (!meta) {
      setResult({ meta: null })
      return
    }

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
