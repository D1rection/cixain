import { useState, useEffect } from 'react'
import styles from './ReadingProgress.module.css'

/** 文章页顶部阅读进度条 */
export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div className={styles.track}>
      <div className={styles.bar} style={{ transform: `scaleX(${progress})` }} />
    </div>
  )
}
