import { useRoute } from 'wouter'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useBlogData } from '../hooks/useBlogData.js'
import useHeadingAnchors from '../hooks/useHeadingAnchors.js'
import parseSegments from '../utils/parseSegments.js'
import SegmentsRenderer from '../components/SegmentsRenderer.jsx'
import ReadingProgress from '../components/ReadingProgress.jsx'
import TableOfContents from '../components/TableOfContents.jsx'
import styles from '../components/PostContent.module.css'

/** 文章详情页 */
export default function BlogPost() {
  const [, params] = useRoute('/blog/:slug')
  const slug = params?.slug
  const { posts = [], post, postContent } = useBlogData()
  const [devHtml, setDevHtml] = useState(null)

  // context post 在客户端导航时已过期，始终用 slug 查找
  const meta = posts.find(p => p.slug === slug) || post
  // context HTML 只当 slug 匹配时可用，否则等待 fetch
  const html = (slug === post?.slug && postContent) || devHtml

  useEffect(() => {
    if (!slug || !meta) return
    if (slug === post?.slug && postContent) return
    fetch(`/content/posts/${slug}.html`)
      .then(r => (r.ok ? r.text() : Promise.reject()))
      .then(setDevHtml)
      .catch(() => {})
  }, [slug])

  // 客户端导航时更新标题
  useEffect(() => {
    if (meta) document.title = `${meta.title} — Cicada's blog`
  }, [meta])

  const { processedHtml, toc } = useHeadingAnchors(html || '')
  const segments = useMemo(() => parseSegments(processedHtml), [processedHtml])
  const contentRef = useRef(null)

  if (!meta) {
    return (
      <main style={{ maxWidth: 680, margin: '0 auto', padding: 48, textAlign: 'center' }}>
        <h1>文章未找到</h1>
        <p style={{ color: 'var(--color-muted)', marginTop: 8 }}>slug: {slug}</p>
      </main>
    )
  }

  return (
    <article>
      <ReadingProgress />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px 0' }}>
        <h1>{meta.title}</h1>
        <p style={{ color: 'var(--color-muted)', marginTop: 8 }}>
          {new Date(meta.date).toLocaleDateString('zh-CN')}
          {meta.category && ` · ${meta.category}`}
        </p>
      </div>
      <TableOfContents toc={toc} contentRef={contentRef} />
      <div ref={contentRef} className={styles.content}>
        <SegmentsRenderer segments={segments} />
      </div>
    </article>
  )
}
