import { Link, useLocation } from 'wouter'
import { useMemo } from 'react'
import { SITE } from '../config.js'
import { useBlogData } from '../hooks/useBlogData.js'
import styles from './Sidebar.module.css'

/** 右侧栏：分类、系列、标签、简介 */
export default function Sidebar() {
  const location = useLocation()[0]
  const { posts = [] } = useBlogData()

  // 从文章数据提取所有标签去重
  const allTags = [...new Set(posts.flatMap(p => p.tags))].sort()

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
            href={slug ? `/category/${slug}` : '/'}
            className={`${styles.catLink} ${slug && location === `/category/${slug}` ? styles.catActive : ''} ${!slug && location === '/' ? styles.catActive : ''}`}
          >
            {label}
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
      {allTags.length > 0 && (
        <div className={styles.section}>
          <p className={styles.heading}>标签</p>
          <div className={styles.tags}>
            {allTags.map(tag => (
              <Link key={tag} href={`/tag/${tag}`} className={styles.tag}>
                {tag}
              </Link>
            ))}
          </div>
        </div>
      )}

    </aside>
  )
}
