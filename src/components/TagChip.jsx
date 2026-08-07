import { Link } from 'wouter'
import styles from './TagChip.module.css'

/**
 * 标签 / 分类 Chip，点击跳转到独立筛选页面
 * @param {{ label: string, param: 'tag' | 'category', variant?: 'accent' }} props
 */
export default function TagChip({ label, param, variant }) {
  const path = param === 'category' ? `/category/${encodeURIComponent(label)}` : `/tag/${encodeURIComponent(label)}`
  const cls = variant === 'accent' ? `${styles.chip} ${styles.accent}` : styles.chip
  return (
    <Link href={path} className={cls}>
      {label}
    </Link>
  )
}
