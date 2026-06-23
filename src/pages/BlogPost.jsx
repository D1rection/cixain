import { useRoute } from 'wouter'
import PostContent from '../components/PostContent.jsx'
import InteractiveWrapper from '../components/InteractiveWrapper.jsx'

function readData(slug) {
  if (typeof document === 'undefined') return null
  const el = document.getElementById('__BLOG_DATA__')
  if (!el) return null
  const data = JSON.parse(el.textContent)
  const meta = data.post || data.posts?.find(p => p.slug === slug)
  const html = data.postContent || meta?.postContent
  return meta ? { meta, html } : null
}

export default function BlogPost() {
  const [, params] = useRoute('/blog/:slug')
  const slug = params?.slug
  const found = readData(slug)

  if (!found || !found.meta) {
    return (
      <main style={{ maxWidth: 680, margin: '0 auto', padding: 48, textAlign: 'center' }}>
        <h1>文章未找到</h1>
        <p style={{ color: '#6b7280', marginTop: 8 }}>slug: {slug}</p>
      </main>
    )
  }

  const { meta, html } = found

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
