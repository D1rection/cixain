import { useNavigate } from 'react-router-dom'
import styles from './TagChip.module.css'

export default function TagChip({ label, param }) {
  const navigate = useNavigate()

  return (
    <button
      className={styles.chip}
      onClick={() => navigate(`/?${param}=${encodeURIComponent(label)}`)}
    >
      {label}
    </button>
  )
}
