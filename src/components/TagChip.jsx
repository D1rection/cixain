import { Link } from 'wouter'
import styles from './TagChip.module.css'
import { routePath } from '../utils/routes.js'

/**
 * 标签 / 分类 Chip，点击跳转到独立筛选页面
 * @param {{ label: string, param: 'tag' | 'category', variant?: 'accent' | 'plain' }} props
 *   accent：像素风强调（列表页分类用）；plain：最简圆角胶囊（文章页头部用）
 */
export default function TagChip({ label, param, variant }) {
  const path = routePath(param === 'category' ? `/category/${encodeURIComponent(label)}` : `/tag/${encodeURIComponent(label)}`)
  const cls = variant === 'accent' ? `${styles.chip} ${styles.accent}`
    : variant === 'plain' ? `${styles.chip} ${styles.plain}`
    : styles.chip
  return (
    <Link href={path} className={cls}>
      {label}
    </Link>
  )
}
