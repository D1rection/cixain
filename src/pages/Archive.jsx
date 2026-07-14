import { useEffect } from 'react'
import { Link } from 'wouter'
import { useBlogData } from '../hooks/useBlogData.js'
import styles from './Archive.module.css'

export default function Archive() {
  const { posts = [] } = useBlogData()

  const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date))

  const years = []
  let currentYear = null
  let currentMonth = null

  for (const post of sorted) {
    const d = new Date(post.date)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const day = d.getDate()
    if (y !== currentYear) {
      currentYear = y
      currentMonth = null
      years.push({ year: y, months: [] })
    }
    if (m !== currentMonth) {
      currentMonth = m
      years[years.length - 1].months.push({ month: m, posts: [] })
    }
    years[years.length - 1].months[years[years.length - 1].months.length - 1].posts.push({ ...post, day, month: m })
  }

  useEffect(() => { document.title = "归档 — Cicada's blog" }, [])

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>归档</h1>
      <p className={styles.count}>{posts.length} 篇文章</p>

      {sorted.length === 0 && (
        <p className={styles.empty}>暂无文章</p>
      )}

      {years.map(y => (
        <section key={y.year} className={styles.yearSection}>
          <h2 className={styles.year}>{y.year}</h2>
          {y.months.map(m => (
            <div key={m.month} className={styles.monthGroup}>
              <h3 className={styles.month}>{m.month}月</h3>
              {m.posts.map(p => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className={styles.postRow}>
                  <span className={styles.postDate}>
                    {String(p.month).padStart(2, '0')}/{String(p.day).padStart(2, '0')}
                  </span>
                  <span className={styles.postTitle}>{p.title}</span>
                </Link>
              ))}
            </div>
          ))}
        </section>
      ))}
    </main>
  )
}
