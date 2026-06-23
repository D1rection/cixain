import { Link } from 'wouter'
import styles from './TagChip.module.css'

/**
 * 标签 / 分类 Chip，点击跳转到首页附带筛选参数
 * @param {{ label: string, param: 'tag' | 'category' }} props
 */
export default function TagChip({ label, param }) {
  return (
    <Link href={`/?${param}=${encodeURIComponent(label)}`} className={styles.chip}>
      {label}
    </Link>
  )
}
