import { Link, useRoute } from 'wouter'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useBlogData } from '../hooks/useBlogData.js'
import useArticleRevisions from '../hooks/useArticleRevisions.js'
import useHeadingAnchors from '../hooks/useHeadingAnchors.js'
import useHashScroll from '../hooks/useHashScroll.js'
import parseSegments from '../utils/parseSegments.js'
import SegmentsRenderer from '../components/SegmentsRenderer.jsx'
import ReadingProgress from '../components/ReadingProgress.jsx'
import TableOfContents from '../components/TableOfContents.jsx'
import PostEnd from '../components/PostEnd.jsx'
import TagChip from '../components/TagChip.jsx'
import ProblemMeta from '../components/ProblemMeta.jsx'
import RevisionReader from '../components/RevisionReader.jsx'
import ChildArticles from '../components/ChildArticles.jsx'
import { directChildPosts, parentPost } from '../utils/postHierarchy.js'
import { decodeRouteSegment } from '../utils/contentRoutes.js'
import { sortSeries } from '../utils/series.js'
import { updateLazyLoad } from '../utils/lazyImages.js'
import { dateKey, formatDate } from '../utils/date.js'
import styles from '../components/PostContent.module.css'
import headerStyles from './BlogPost.module.css'

function addComparisonHeadingIds(html, toc) {
  let index = 0
  return html.replace(/<h([1-6])(\s[^>]*)?>/gi, (match, level, attrs = '') => {
    if (/data-revision-state="removed"/i.test(attrs)) return match
    const item = toc[index++]
    if (!item) return match
    const cleaned = attrs.replace(/\s+id="[^"]*"/i, '')
    const style = /\sstyle\s*=/i.test(cleaned) ? '' : ' style="scroll-margin-top: var(--heading-scroll-margin)"'
    return `<h${level}${cleaned} id="${item.id}"${style}>`
  })
}

/** 文章详情页 */
export default function BlogPost() {
  const [, params] = useRoute('/blog/:slug')
  const { posts = [], post } = useBlogData()
  const routeSlug = params?.slug || ''
  const slug = post?.slug === routeSlug || posts.some(item => item.slug === routeSlug)
    ? routeSlug : decodeRouteSegment(routeSlug)
  const [devHtml, setDevHtml] = useState(null)

  // post 优先匹配：SSG 文章页用内联正文参与水合，避免命中元数据后闪空/错位
  const meta = post?.slug === slug ? post : posts.find(p => p.slug === slug)
  // SSG 下 meta.postContent 可用；Dev SPA 需 fetch 回退
  const html = meta?.postContent ?? (devHtml?.slug === slug ? devHtml.html : null)
  const children = useMemo(() => directChildPosts(posts, meta?.id), [posts, meta?.id])
  const parent = parentPost(posts, meta)
  const revisions = useArticleRevisions(meta, slug)

  useEffect(() => {
    if (!slug || !meta) return
    if (meta.postContent !== undefined) return  // SSG 已有内容
    const controller = new AbortController()
    setDevHtml(null)
    fetch(`${import.meta.env.BASE_URL}content/posts/${encodeURIComponent(slug)}.html`, { signal: controller.signal })
      .then(r => (r.ok && r.headers.get('content-type')?.includes('text/html') ? r.text() : Promise.reject()))
      .then(html => { if (!controller.signal.aborted && !/<!doctype|<html[\s>]/i.test(html)) setDevHtml({ slug, html }) })
      .catch(() => {})
    return () => controller.abort()
  }, [slug, meta?.postContent])

  // 客户端导航时更新标题
  useEffect(() => {
    if (meta) document.title = `${meta.title} — Cicada's blog`
  }, [meta])

  // 内容 HTML 变化（dev fetch 完成 / SSG 路由切换）后让懒加载重扫 DOM
  useEffect(() => {
    updateLazyLoad()
  }, [html, revisions.comparison])

  const { processedHtml: latestHtml, toc: latestToc } = useHeadingAnchors(html || '')
  const comparisonHtml = useMemo(() => {
    if (revisions.status !== 'ready' || !revisions.comparison) return ''
    return addComparisonHeadingIds(revisions.comparison.html, revisions.comparison.toc || [])
  }, [revisions.status, revisions.comparison])
  const isComparing = revisions.status === 'ready' && !!comparisonHtml
  const displayHtml = isComparing ? comparisonHtml : latestHtml
  const toc = isComparing ? (revisions.comparison.toc || []) : latestToc
  const segments = useMemo(() => parseSegments(latestHtml), [latestHtml])
  const comparisonMarkup = useMemo(() => ({ __html: comparisonHtml }), [comparisonHtml])
  const seriesInfo = useMemo(() => {
    if (!meta?.series || meta.parentId) return undefined
    const sp = sortSeries(posts, meta.series)
    return {
      name: meta.series,
      pos: sp.findIndex(p => p.slug === meta.slug) + 1,
      total: sp.length,
    }
  }, [meta, posts])
  const contentRef = useRef(null)

  // 块引用跳转：内容渲染 + 懒加载落定后定位 hash 对应块并高亮
  useHashScroll(displayHtml, contentRef, styles.targetFlash)

  // 更新时间：git 注入的 updated 与发布日不同才显示（避免冗余/假数据）
  const showUpdated = !!meta?.updated && dateKey(meta.updated) !== dateKey(meta.date)

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
      <header className={headerStyles.header}>
        <h1>{meta.title}</h1>
        <p className={headerStyles.metaLine}>
          <span>
            <time dateTime={meta.date}>
              {formatDate(meta.date)}
            </time>
          </span>
          {showUpdated && (
            <span>· 更新于 {formatDate(meta.updated)}</span>
          )}
          {!meta.parentId && meta.category && <span>· {meta.category}</span>}
        </p>
        {meta.tags?.length > 0 && (
          <div className={headerStyles.tagRow}>
            {meta.tags.map(tag => (
              <TagChip key={tag} label={tag} param="tag" variant="plain" linked={!meta.parentId} />
            ))}
          </div>
        )}
        {parent && (
          <p className={headerStyles.parentLink}>
            <Link href={parent.contentUrl}>返回父文章：{parent.title}</Link>
          </p>
        )}
        <RevisionReader
          revisions={revisions.revisions}
          compareId={revisions.compareId}
          comparison={revisions.comparison}
          status={revisions.status}
          message={revisions.message}
          onSelect={revisions.selectRevision}
          onRetry={revisions.retry}
        />
        <ChildArticles key={meta.id} articles={children} />
      </header>
      <TableOfContents toc={toc} contentRef={contentRef} series={seriesInfo} />
      <div ref={contentRef} className={styles.content}>
        <ProblemMeta meta={meta} />
        {isComparing
          ? <div dangerouslySetInnerHTML={comparisonMarkup} />
          : <SegmentsRenderer segments={segments} />}
      </div>
      <PostEnd post={meta} posts={posts} />
    </article>
  )
}
