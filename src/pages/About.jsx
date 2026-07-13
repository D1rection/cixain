import { useEffect, useState } from 'react'
import { useBlogData } from '../hooks/useBlogData.js'
import contentStyles from '../components/PostContent.module.css'

/** 关于页 */
export default function About() {
  useEffect(() => { document.title = '关于 — Cicada\'s blog' }, [])
  const { pageContent: ssrContent } = useBlogData()
  const [content, setContent] = useState(ssrContent || '')

  useEffect(() => {
    if (ssrContent) return
    fetch('/content/pages/pages.json')
      .then(r => r.json())
      .then(d => setContent(d.about || ''))
      .catch(() => {})
  }, [ssrContent])

  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: 24 }}>
      <h1>关于</h1>
      {content ? (
        <div className={contentStyles.content} dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <p style={{ color: 'var(--color-muted)', marginTop: 16 }}>介绍内容待补充</p>
      )}
    </main>
  )
}
