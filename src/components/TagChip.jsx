import { Link } from 'wouter'
import styles from './TagChip.module.css'

/**
 * 标签 / 分类 Chip，点击跳转到独立筛选页面
 * @param {{ label: string, param: 'tag' | 'category' }} props
 */
export default function TagChip({ label, param }) {
  const path = param === 'category' ? `/category/${encodeURIComponent(label)}` : `/tag/${encodeURIComponent(label)}`
  return (
    <Link href={path} className={styles.chip}>
      {label}
    </Link>
  )
}
