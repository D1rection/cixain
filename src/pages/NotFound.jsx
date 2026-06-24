import { useEffect } from 'react'

/** 404 页面 */
export default function NotFound() {
  useEffect(() => { document.title = '404 — Cicada\'s blog' }, [])
  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: 48, textAlign: 'center' }}>
      <h1>404</h1>
      <p style={{ color: '#6b7280', marginTop: 8 }}>页面未找到</p>
    </main>
  )
}
