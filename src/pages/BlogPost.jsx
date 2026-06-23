import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useBlogData } from '../hooks/useBlogData.js'
import PostContent from '../components/PostContent.jsx'
import InteractiveWrapper from '../components/InteractiveWrapper.jsx'

export default function BlogPost() {
  const { slug } = useParams()
  const { posts = [], post, postContent: ssgContent } = useBlogData()

  const meta = post || posts.find(p => p.slug === slug)

  // ssgContent: 直接访问时由 __BLOG_DATA__ 提供
  // meta.postContent: 首页的 posts 数据里包含所有文章内容
  const [html, setHtml] = useState(ssgContent || meta?.postContent || null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (html) return

    if (!meta) {
      setError(true)
      return
    }

    // Dev SPA fallback
    fetch(`/content/posts/${slug}.html`)
      .then(r => {
        if (!r.ok) throw new Error('not found')
        return r.text()
      })
      .then(setHtml)
      .catch(() => setError(true))
  }, [slug])

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
