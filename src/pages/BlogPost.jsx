import { useRoute } from 'wouter'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useBlogData } from '../hooks/useBlogData.js'
import useHeadingAnchors from '../hooks/useHeadingAnchors.js'
import useHashScroll from '../hooks/useHashScroll.js'
import parseSegments from '../utils/parseSegments.js'
import SegmentsRenderer from '../components/SegmentsRenderer.jsx'
import ReadingProgress from '../components/ReadingProgress.jsx'
import TableOfContents from '../components/TableOfContents.jsx'
import PostEnd from '../components/PostEnd.jsx'
import TagChip from '../components/TagChip.jsx'
import ProblemMeta from '../components/ProblemMeta.jsx'
import { sortSeries } from '../utils/series.js'
import { updateLazyLoad } from '../utils/lazyImages.js'
import { dateKey, formatDate } from '../utils/date.js'
import styles from '../components/PostContent.module.css'
import headerStyles from './BlogPost.module.css'

/** 文章详情页 */
export default function BlogPost() {
  const [, params] = useRoute('/blog/:slug')
  const slug = params?.slug
  const { posts = [], post, postContent } = useBlogData()
  const [devHtml, setDevHtml] = useState(null)

  // post 优先匹配：SSG 文章页用内联正文参与水合，避免命中元数据后闪空/错位
  const meta = post?.slug === slug ? post : posts.find(p => p.slug === slug) || post
  // SSG 下 meta.postContent 可用；Dev SPA 需 fetch 回退
  const html = meta?.postContent || devHtml

  useEffect(() => {
    if (!slug || !meta) return
    if (meta.postContent) return  // SSG 已有内容
    fetch(`/content/posts/${slug}.html`)
      .then(r => (r.ok ? r.text() : Promise.reject()))
      .then(setDevHtml)
      .catch(() => {})
  }, [slug])

  // 客户端导航时更新标题
  useEffect(() => {
    if (meta) document.title = `${meta.title} — Cicada's blog`
  }, [meta])

  // 内容 HTML 变化（dev fetch 完成 / SSG 路由切换）后让懒加载重扫 DOM
  useEffect(() => {
    updateLazyLoad()
  }, [html])

  const { processedHtml, toc } = useHeadingAnchors(html || '')
  const segments = useMemo(() => parseSegments(processedHtml), [processedHtml])
  const seriesInfo = useMemo(() => {
    if (!meta?.series) return undefined
    const sp = sortSeries(posts, meta.series)
    return {
      name: meta.series,
      pos: sp.findIndex(p => p.slug === meta.slug) + 1,
      total: sp.length,
    }
  }, [meta, posts])
  const contentRef = useRef(null)

  // 块引用跳转：内容渲染 + 懒加载落定后定位 hash 对应块并高亮
  useHashScroll(processedHtml, contentRef, styles.targetFlash)

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
          {meta.category && <span>· {meta.category}</span>}
        </p>
        {meta.tags?.length > 0 && (
          <div className={headerStyles.tagRow}>
            {meta.tags.map(tag => (
              <TagChip key={tag} label={tag} param="tag" variant="plain" />
            ))}
          </div>
        )}
      </header>
      <TableOfContents toc={toc} contentRef={contentRef} series={seriesInfo} />
      <div ref={contentRef} className={styles.content}>
        <ProblemMeta meta={meta} />
        <SegmentsRenderer segments={segments} />
      </div>
      <PostEnd post={meta} posts={posts} />
    </article>
  )
}
