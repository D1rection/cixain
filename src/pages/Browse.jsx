import { useEffect, useMemo } from 'react'
import { Link } from 'wouter'
import { useBlogData } from '../hooks/useBlogData.js'
import { routePath } from '../utils/routes.js'
import { buildTaxonomy } from '../utils/taxonomy.js'
import styles from './Browse.module.css'

/** 文章索引：以统一的文字目录呈现分类、系列和标签。 */
export default function Browse() {
  const { posts = [] } = useBlogData()
  const { categories, series, tags, tagMax } = useMemo(() => buildTaxonomy(posts), [posts])

  useEffect(() => { document.title = "文章索引 — Cicada's blog" }, [])

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>文章索引</h1>
        <p className={styles.count}>{posts.length} 篇文章</p>
      </header>

      <section className={styles.section} aria-labelledby="browse-categories">
        <h2 id="browse-categories" className={styles.heading}>
          <span className={styles.sectionIndex} aria-hidden="true">01</span>
          <span>分类</span>
        </h2>
        <div className={styles.categoryGrid}>
          {categories.map(({ label, slug, count }) => (
            <Link
              key={slug}
              href={routePath(`/category/${slug}`)}
              className={styles.categoryLink}
              aria-label={`${label}，${count} 篇文章`}
            >
              <span>{label}</span>
              <span className={styles.categoryCount} aria-hidden="true">{count}</span>
            </Link>
          ))}
        </div>
      </section>

      {series.length > 0 && (
        <section className={styles.section} aria-labelledby="browse-series">
          <h2 id="browse-series" className={styles.heading}>
            <span className={styles.sectionIndex} aria-hidden="true">02</span>
            <span>系列</span>
          </h2>
          <div className={styles.seriesList}>
            {series.map(({ name, count }, index) => (
              <Link
                key={name}
                href={routePath(`/series/${encodeURIComponent(name)}`)}
                className={styles.seriesLink}
                aria-label={`${name}，${count} 篇文章`}
              >
                <span className={styles.seriesIndex} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className={styles.itemName}>{name}</span>
                <span className={styles.itemMeta} aria-hidden="true">{count} 篇</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {tags.length > 0 && (
        <section className={styles.section} aria-labelledby="browse-tags">
          <h2 id="browse-tags" className={styles.heading}>
            <span className={styles.sectionIndex} aria-hidden="true">03</span>
            <span>标签</span>
          </h2>
          <div className={styles.tags}>
            {tags.map(({ name, count }) => {
              const tier = count >= tagMax / 2 ? styles.tagHot : count >= tagMax / 4 ? styles.tagMid : ''
              return (
                <Link
                  key={name}
                  href={routePath(`/tag/${encodeURIComponent(name)}`)}
                  className={`${styles.tag} ${tier}`}
                  aria-label={`${name}，${count} 篇文章`}
                >
                  <span>#{name}</span><span className={styles.tagCount} aria-hidden="true">{count}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
