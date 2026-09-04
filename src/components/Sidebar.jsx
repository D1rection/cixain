import { Link, useLocation } from 'wouter'
import { useMemo } from 'react'
import { useBlogData } from '../hooks/useBlogData.js'
import { sameRoute, routePath } from '../utils/routes.js'
import { buildTaxonomy } from '../utils/taxonomy.js'
import styles from './Sidebar.module.css'

/** 右侧栏：分类（带计数）、系列、标签（按热度加权）、简介 */
export default function Sidebar() {
  const location = useLocation()[0]
  const { posts = [] } = useBlogData()

  const { categories, series: seriesList, tags: tagList, tagMax } = useMemo(() => buildTaxonomy(posts), [posts])

  return (
    <aside className={styles.sidebar}>
      {/* 分类 */}
      <div className={styles.section}>
        <p className={styles.heading}>分类</p>
        {categories.map(({ label, slug, count }) => (
          <Link
            key={label}
            href={routePath(`/category/${slug}`)}
            className={`${styles.catLink} ${sameRoute(location, `/category/${slug}`) ? styles.catActive : ''}`}
          >
            <span>{label}</span>
            <span className={styles.catCount}>{count}</span>
          </Link>
        ))}
      </div>

      {/* 系列 */}
      {seriesList.length > 0 && (
        <div className={styles.section}>
          <p className={styles.heading}>系列</p>
          {seriesList.map(s => {
            const active = sameRoute(location, `/series/${encodeURIComponent(s.name)}`)
            return (
              <Link
                key={s.name}
                href={routePath(`/series/${encodeURIComponent(s.name)}`)}
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
      {tagList.length > 0 && (
        <div className={styles.section}>
          <p className={styles.heading}>标签</p>
          <div className={styles.tags}>
            {tagList.map(({ name, count }) => {
              // 热度档位：热门放大字号（直接用 styles 引用，避免字符串拼接大小写问题）
              const tierCls = count >= tagMax / 2 ? styles.tagHot : count >= tagMax / 4 ? styles.tagMid : ''
              return (
                <Link
                  key={name}
                  href={routePath(`/tag/${encodeURIComponent(name)}`)}
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
