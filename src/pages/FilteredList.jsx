import { useEffect } from 'react'
import { useRoute, Link } from 'wouter'
import { useBlogData } from '../hooks/useBlogData.js'
import PostList from '../components/PostList.jsx'
import Pagination from '../components/Pagination.jsx'
import { PAGE_SIZE, SITE } from '../config.js'
import styles from './FilteredList.module.css'

/**
 * 分类/标签筛选页面
 * 路由：/category/:slug  /tag/:slug
 */
export default function FilteredList({ type }) {
  const [, params] = useRoute(`/${type}/:slug`)
  const slug = params?.slug
  const { posts = [] } = useBlogData()

  const label = type === 'category'
    ? (SITE.categories.find(([, s]) => s === slug)?.[0] || slug)
    : slug

  const filtered = posts.filter(p => {
    if (type === 'category') return p.category === slug
    return p.tags.includes(slug)
  })

  const total = filtered.length

  useEffect(() => {
    document.title = `${label} — Cicada's blog`
  }, [label])

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.badge}>
          {type === 'category' ? '分类' : '标签'}
        </div>
        <h1 className={styles.title}>{label}</h1>
        <p className={styles.count}>
          {total} 篇文章
          <Link href="/" className={styles.clear}>回到首页</Link>
        </p>
      </header>
      <PostList posts={filtered} />
      {filtered.length > PAGE_SIZE && (
        <Pagination total={total} page={1} />
      )}
    </main>
  )
}
