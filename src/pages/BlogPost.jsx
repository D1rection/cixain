import { useRoute } from 'wouter'
import { useState, useEffect } from 'react'
import { useBlogData } from '../hooks/useBlogData.js'
import PostContent from '../components/PostContent.jsx'
import InteractiveWrapper from '../components/InteractiveWrapper.jsx'

/** 文章详情页 */
export default function BlogPost() {
  const [, params] = useRoute('/blog/:slug')
  const slug = params?.slug
  const { posts = [], post, postContent } = useBlogData()
  const [devHtml, setDevHtml] = useState(null)

  // SSG: post + postContent 来自 hydration 时注入的 Context
  // 客户端导航: posts 中已有所有文章内容（方案 A）
  const meta = post || posts.find(p => p.slug === slug)
  const html = postContent || meta?.postContent || devHtml

  // Dev SPA fallback
  useEffect(() => {
    if (postContent || meta?.postContent) return
    if (!meta) return
    fetch(`/content/posts/${slug}.html`)
      .then(r => (r.ok ? r.text() : Promise.reject()))
      .then(setDevHtml)
      .catch(() => {})
  }, [slug])

  if (!meta) {
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
        <h1>{meta.title}</h1>
        <p style={{ color: '#6b7280', marginTop: 8 }}>
          {new Date(meta.date).toLocaleDateString('zh-CN')}
          {meta.category && ` · ${meta.category}`}
        </p>
      </div>
      <PostContent html={html || ''} />
      <InteractiveWrapper />
    </article>
  )
}
