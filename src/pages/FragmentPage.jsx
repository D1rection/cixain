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
  const [devHtml, setDevHtml] = useState(null)
  const html = meta?.fragmentContent || devHtml || ''
  const contentRef = useRef(null)
  const { processedHtml, toc } = useHeadingAnchors(html)
  const segments = useMemo(() => parseSegments(processedHtml), [processedHtml])

  useEffect(() => {
    if (!slug || !meta || typeof meta.fragmentContent === 'string') return
    let active = true
    setDevHtml(null)
    fetch(`/content/fragment/${encodeURIComponent(slug)}.html`)
      .then(response => response.ok ? response.text() : Promise.reject())
      .then(source => { if (active) setDevHtml(source) })
      .catch(() => { if (active) setDevHtml('') })
    return () => { active = false }
  }, [slug, meta?.fragmentContent])

  useEffect(() => {
    if (meta) document.title = `${meta.title} — Cicada's blog`
  }, [meta])
  useEffect(() => { updateLazyLoad() }, [html])
  useHashScroll(processedHtml, contentRef, contentStyles.targetFlash)

  if (!meta) {
    return (
      <main className={styles.notFound}>
        <h1>碎片未找到</h1>
        <p>slug: {slug}</p>
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
        <SegmentsRenderer segments={segments} />
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
