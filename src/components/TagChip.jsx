import { Link } from 'wouter'
import styles from './TagChip.module.css'

export default function TagChip({ label, param }) {
  return (
    <Link href={`/?${param}=${encodeURIComponent(label)}`} className={styles.chip}>
      {label}
    </Link>
  )
}
