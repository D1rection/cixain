import { useEffect, useMemo } from 'react'
import { Link } from 'wouter'
import { useBlogData } from '../hooks/useBlogData.js'
import { routePath } from '../utils/routes.js'
import { buildTaxonomy } from '../utils/taxonomy.js'
import styles from './Browse.module.css'

/** 文章索引：从单一入口浏览分类、系列和标签。 */
export default function Browse() {
  const { posts = [] } = useBlogData()
  const { categories, series, tags, tagMax } = useMemo(() => buildTaxonomy(posts), [posts])

  useEffect(() => { document.title = "文章索引 — Cicada's blog" }, [])

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.eyebrow}>INDEX / MAP</div>
        <h1 className={styles.title}>文章索引</h1>
        <p className={styles.intro}>按分类、系列和标签，找到想读的文章。</p>
        <p className={styles.count}>{posts.length} 篇文章</p>
      </header>

      <section className={styles.section} aria-labelledby="browse-categories">
        <h2 id="browse-categories" className={styles.heading}>分类</h2>
        <div className={styles.categoryGrid}>
          {categories.map(({ label, slug, count }) => (
            <Link key={slug} href={routePath(`/category/${slug}`)} className={styles.categoryLink}>
              <span>{label}</span>
              <span className={styles.itemCount}>{count}</span>
            </Link>
          ))}
        </div>
      </section>

      {series.length > 0 && (
        <section className={styles.section} aria-labelledby="browse-series">
          <h2 id="browse-series" className={styles.heading}>系列</h2>
          <div className={styles.seriesList}>
            {series.map(({ name, count }) => (
              <Link key={name} href={routePath(`/series/${encodeURIComponent(name)}`)} className={styles.seriesLink}>
                <span className={styles.itemName}>{name}</span>
                <span className={styles.itemMeta}>{count} 篇 <span aria-hidden="true">›</span></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {tags.length > 0 && (
        <section className={styles.section} aria-labelledby="browse-tags">
          <h2 id="browse-tags" className={styles.heading}>标签</h2>
          <div className={styles.tags}>
            {tags.map(({ name, count }) => {
              const tier = count >= tagMax / 2 ? styles.tagHot : count >= tagMax / 4 ? styles.tagMid : ''
              return (
                <Link key={name} href={routePath(`/tag/${encodeURIComponent(name)}`)} className={`${styles.tag} ${tier}`}>
                  <span>#{name}</span><span className={styles.tagCount}>{count}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
