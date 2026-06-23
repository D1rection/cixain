import { useParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import posts from '../../content/posts/posts.json'
import PostContent from '../components/PostContent.jsx'
import InteractiveWrapper from '../components/InteractiveWrapper.jsx'

export default function BlogPost() {
  const { slug } = useParams()
  const [html, setHtml] = useState(null)
  const [error, setError] = useState(false)
  const contentRef = useRef(null)

  const post = posts.find(p => p.slug === slug)

  useEffect(() => {
    if (!post) {
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
        <h1>{post.title}</h1>
        <p style={{ color: '#6b7280', marginTop: 8 }}>
          {new Date(post.date).toLocaleDateString('zh-CN')}
          {post.category && ` · ${post.category}`}
        </p>
      </div>
      <div ref={contentRef}>
        <PostContent html={html} />
      </div>
      <InteractiveWrapper containerRef={contentRef} />
    </article>
  )
}
