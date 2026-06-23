import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useBlogData } from '../hooks/useBlogData.js'
import PostContent from '../components/PostContent.jsx'
import InteractiveWrapper from '../components/InteractiveWrapper.jsx'

export default function BlogPost() {
  const { slug } = useParams()
  const { posts = [], post, postContent: ssgContent } = useBlogData()

  // SSR 时 postContent 同步可用, 不走 useEffect
  const [html, setHtml] = useState(ssgContent || null)
  const [error, setError] = useState(false)

  const meta = post || posts.find(p => p.slug === slug)

  useEffect(() => {
    // SSG 模式: 已有内容
    if (ssgContent) return

    // Dev SPA 模式: 需要 fetch
    if (!meta) {
      setError(true)
      return
    }

    fetch(`/content/posts/${slug}.html`)
      .then(r => {
        if (!r.ok) throw new Error('not found')
        return r.text()
      })
      .then(setHtml)
      .catch(() => setError(true))
  }, [slug, ssgContent, meta])

  if (error) {
    return (
      <main style={{ maxWidth: 680, margin: '0 auto', padding: 48, textAlign: 'center' }}>
        <h1>文章未找到</h1>
        <p style={{ color: '#6b7280', marginTop: 8 }}>slug: {slug}</p>
      </main>
    )
  }

  if (!html) {
    return (
      <main style={{ maxWidth: 680, margin: '0 auto', padding: 48 }}>
        <p style={{ color: '#6b7280' }}>加载中...</p>
      </main>
    )
  }

  return (
    <article>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px 0' }}>
        <h1>{meta.title}</h1>
        <p style={{ color: '#6b7280', marginTop: 8 }}>
          {new Date(meta.date).toLocaleDateString('zh-CN')}
          {meta.category && ` · ${meta.category}`}
        </p>
      </div>
      <PostContent html={html} />
      <InteractiveWrapper />
    </article>
  )
}
