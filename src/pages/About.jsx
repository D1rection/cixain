import { useEffect } from 'react'
import { useBlogData } from '../hooks/useBlogData.js'
import contentStyles from '../components/PostContent.module.css'

/** 关于页 */
export default function About() {
  useEffect(() => { document.title = '关于 — Cicada\'s blog' }, [])
  const { pageContent } = useBlogData()

  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: 24 }}>
      <h1>关于</h1>
      {pageContent ? (
        <div className={contentStyles.content} dangerouslySetInnerHTML={{ __html: pageContent }} />
      ) : (
        <p style={{ color: 'var(--color-muted)', marginTop: 16 }}>介绍内容待补充</p>
      )}
    </main>
  )
}
