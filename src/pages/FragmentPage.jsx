import { useEffect, useMemo, useRef, useState } from 'react'
import { useRoute } from 'wouter'
import { useBlogData } from '../hooks/useBlogData.js'
import useHeadingAnchors from '../hooks/useHeadingAnchors.js'
import useHashScroll from '../hooks/useHashScroll.js'
import parseSegments from '../utils/parseSegments.js'
import { decodeRouteSegment } from '../utils/contentRoutes.js'
import { dateKey, formatDate } from '../utils/date.js'
import SegmentsRenderer from '../components/SegmentsRenderer.jsx'
import TableOfContents from '../components/TableOfContents.jsx'
import { updateLazyLoad } from '../utils/lazyImages.js'
import contentStyles from '../components/PostContent.module.css'
import styles from './FragmentPage.module.css'

/** Standalone knowledge fragment page. */
export default function FragmentPage() {
  const [, params] = useRoute('/fragment/:slug')
  const { fragment: pageFragment, fragments = [] } = useBlogData()
  const routeSlug = params?.slug || ''
  const slug = pageFragment?.slug === routeSlug || fragments.some(item => item.slug === routeSlug)
    ? routeSlug
    : decodeRouteSegment(routeSlug)
  const meta = pageFragment?.slug === slug
    ? pageFragment
    : fragments.find(item => item.slug === slug)
  const [body, setBody] = useState({ slug: '', status: 'idle', html: '' })
  const [retry, setRetry] = useState(0)
  const inline = typeof meta?.fragmentContent === 'string'
  const currentBody = body.slug === slug ? body : { status: 'loading', html: '' }
  const html = inline ? meta.fragmentContent : currentBody.status === 'success' ? currentBody.html : ''
  const contentRef = useRef(null)
  const { processedHtml, toc } = useHeadingAnchors(html)
  const segments = useMemo(() => parseSegments(processedHtml), [processedHtml])

  useEffect(() => {
    if (!slug || !meta || typeof meta.fragmentContent === 'string') return
    const controller = new AbortController()
    let active = true
    setBody({ slug, status: 'loading', html: '' })
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    fetch(`${base}/content/fragment/${encodeURIComponent(slug)}.html`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('正文请求失败')
        const source = await response.text()
        if (/<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i.test(source)
          || !response.headers.get('content-type')?.includes('text/html')) {
          throw new Error('返回的不是碎片正文')
        }
        return source
      })
      .then(source => { if (active) setBody({ slug, status: 'success', html: source }) })
      .catch(error => {
        if (active && error.name !== 'AbortError') setBody({ slug, status: 'error', html: '' })
      })
    return () => { active = false; controller.abort() }
  }, [slug, inline, !!meta, retry])

  useEffect(() => {
    if (meta) document.title = `${meta.title} — Cicada's blog`
  }, [meta])
  useEffect(() => { updateLazyLoad() }, [html])
  useHashScroll(processedHtml, contentRef, contentStyles.targetFlash)

  if (!meta) {
    return (
      <main className={styles.notFound}>
        <h1>碎片未找到</h1>
        <p>内容可能尚未发布，或链接已变更。</p>
      </main>
    )
  }

  const showUpdated = !!meta.updated && dateKey(meta.updated) !== dateKey(meta.date)
  return (
    <article>
      <header className={styles.header}>
        <p className={styles.kind}>FRAGMENT</p>
        <h1>{meta.title}</h1>
        <p className={styles.metaLine}>
          <time dateTime={meta.date}>{formatDate(meta.date)}</time>
          {showUpdated && <span>· 更新于 {formatDate(meta.updated)}</span>}
        </p>
      </header>
      <TableOfContents toc={toc} contentRef={contentRef} />
      <div ref={contentRef} className={`${contentStyles.content} ${styles.content}`}>
        {!inline && currentBody.status !== 'success' ? (
          <div className={styles.loadState} role={currentBody.status === 'error' ? 'alert' : 'status'}>
            {currentBody.status === 'error' ? <>
              <p>内容加载失败，请稍后重试。</p>
              <button type="button" onClick={() => {
                setBody({ slug, status: 'loading', html: '' })
                setRetry(value => value + 1)
              }}>重试</button>
            </> : <p>正在加载内容…</p>}
          </div>
        ) : <SegmentsRenderer segments={segments} />}
        {meta.backlinks?.length > 0 && (
          <aside className={styles.backlinks} aria-labelledby="fragment-backlinks-title">
            <h2 id="fragment-backlinks-title">被引用于</h2>
            <ul>
              {meta.backlinks.map(item => (
                <li key={item.id}>
                  <a href={item.url}>{item.title}</a>
                  <span>{item.kind === 'fragment' ? '碎片' : '文章'}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </article>
  )
}
