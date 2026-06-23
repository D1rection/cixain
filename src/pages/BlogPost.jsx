import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useBlogData } from '../hooks/useBlogData.js'
import PostContent from '../components/PostContent.jsx'
import InteractiveWrapper from '../components/InteractiveWrapper.jsx'

export default function BlogPost() {
  const { slug } = useParams()
  const { posts = [], post, postContent: ssgContent } = useBlogData()

  // SSG 首屏: post + postContent 由 __BLOG_DATA__ 同步注入
  const [html, setHtml] = useState(ssgContent || null)
  const [error, setError] = useState(false)

  const meta = post || posts.find(p => p.slug === slug)

  useEffect(() => {
    // SSG 首屏: 已有内容
    if (ssgContent) return

    if (!meta) {
      setError(true)
      return
    }

    // 生产: 按需加载 data.json
    // Dev SPA: 直接取 content 目录的原始 HTML
    const url = import.meta.env.PROD
      ? `/blog/${slug}/data.json`
      : `/content/posts/${slug}.html`

    fetch(url)
      .then(async res => {
        if (!res.ok) throw new Error('not found')
        const text = await res.text()

        if (import.meta.env.PROD) {
          const data = JSON.parse(text)
          setHtml(data.postContent)
        } else {
          setHtml(text)
        }
      })
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
