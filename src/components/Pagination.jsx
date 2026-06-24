import { Link } from 'wouter'
import { PAGE_SIZE } from '../config.js'
import styles from './Pagination.module.css'

/**
 * 分页导航
 * @param {{ total: number, page: number, base?: string }} props
 */
export default function Pagination({ total, page, base = '/' }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  if (totalPages <= 1) return null

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i)
  }

  return (
    <nav className={styles.nav}>
      {page > 1 && (
        <Link href={page === 2 ? base : `${base}?page=${page - 1}`} className={styles.page}>
          ‹
        </Link>
      )}
      {pages.map(p => (
        <Link
          key={p}
          href={p === 1 ? base : `${base}?page=${p}`}
          className={`${styles.page} ${p === page ? styles.active : ''}`}
        >
          {p}
        </Link>
      ))}
      {page < totalPages && (
        <Link href={`${base}?page=${page + 1}`} className={styles.page}>
          ›
        </Link>
      )}
    </nav>
  )
}
