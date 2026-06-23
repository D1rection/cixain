import { useBlogData } from '../hooks/useBlogData.js'

/** 关于页 */
export default function About() {
  const { pageContent } = useBlogData()

  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: 24 }}>
      <h1>关于</h1>
      {pageContent ? (
        <div dangerouslySetInnerHTML={{ __html: pageContent }} />
      ) : (
        <p style={{ color: '#6b7280', marginTop: 16 }}>介绍内容待补充</p>
      )}
    </main>
  )
}
