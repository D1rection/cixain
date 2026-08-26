import { Link, useLocation } from 'wouter'
import { useMemo } from 'react'
import { SITE } from '../config.js'
import { useBlogData } from '../hooks/useBlogData.js'
import styles from './Sidebar.module.css'

/** 右侧栏：分类（带计数）、系列、标签（按热度加权）、简介 */
export default function Sidebar() {
  const location = useLocation()[0]
  const { posts = [] } = useBlogData()

  // 分类计数：articles 中匹配分类值的文章数（侧边栏只列具体分类，无「全部」项）
  const catCounts = useMemo(() => {
    const m = new Map(SITE.categories.map(([label, slug]) => [slug, 0]))
    posts.forEach(p => {
      if (m.has(p.category)) m.set(p.category, m.get(p.category) + 1)
    })
    return m
  }, [posts])

  // 标签统计：文章数降序（同级按名称升序保证稳定），max 用于分档
  const tagStats = useMemo(() => {
    const byName = new Map()
    posts.forEach(p => p.tags.forEach(t => byName.set(t, (byName.get(t) || 0) + 1)))
    const list = [...byName.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    const max = list.length ? Math.max(...list.map(t => t.count)) : 0
    return { list, max }
  }, [posts])

  // 系列：按系列内最新文章日期降序（活跃系列靠前），含篇数
  const seriesList = useMemo(() => {
    const byName = new Map()
    posts.forEach(p => {
      if (!p.series) return
      if (!byName.has(p.series)) byName.set(p.series, [])
      byName.get(p.series).push(p)
    })
    return [...byName.entries()]
      .map(([name, list]) => ({
        name,
        count: list.length,
        latest: Math.max(...list.map(p => +new Date(p.date))),
      }))
      .sort((a, b) => b.latest - a.latest || a.name.localeCompare(b.name))
  }, [posts])

  return (
    <aside className={styles.sidebar}>
      {/* 分类 */}
      <div className={styles.section}>
        <p className={styles.heading}>分类</p>
        {SITE.categories.map(([label, slug]) => (
          <Link
            key={label}
            href={`/category/${slug}`}
            className={`${styles.catLink} ${location === `/category/${slug}` ? styles.catActive : ''}`}
          >
            <span>{label}</span>
            <span className={styles.catCount}>{catCounts.get(slug)}</span>
          </Link>
        ))}
      </div>

      {/* 系列 */}
      {seriesList.length > 0 && (
        <div className={styles.section}>
          <p className={styles.heading}>系列</p>
          {seriesList.map(s => {
            const active = location === `/series/${encodeURIComponent(s.name)}`
            return (
              <Link
                key={s.name}
                href={`/series/${encodeURIComponent(s.name)}`}
                className={`${styles.seriesLink} ${active ? styles.seriesActive : ''}`}
              >
                <span>{s.name}</span>
                <span className={styles.seriesCount}>{s.count}</span>
              </Link>
            )
          })}
        </div>
      )}

      {/* 标签 */}
      {tagStats.list.length > 0 && (
        <div className={styles.section}>
          <p className={styles.heading}>标签</p>
          <div className={styles.tags}>
            {tagStats.list.map(({ name, count }) => {
              // 热度档位：热门放大字号（直接用 styles 引用，避免字符串拼接大小写问题）
              const tierCls = count >= tagStats.max / 2 ? styles.tagHot : count >= tagStats.max / 4 ? styles.tagMid : ''
              return (
                <Link
                  key={name}
                  href={`/tag/${name}`}
                  className={`${styles.tag} ${tierCls}`}
                >
                  {name}
                  <span className={styles.tagCount}>{count}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

    </aside>
  )
}