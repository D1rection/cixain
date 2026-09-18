import { useState, useEffect } from 'react'
import styles from './ReadingProgress.module.css'
import { useScrollTarget } from '../hooks/useScrollTarget.js'

/** 文章页顶部阅读进度条 */
export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  const { target } = useScrollTarget()

  useEffect(() => {
    if (!target) return undefined
    const update = () => {
      const scrollTop = target === window ? window.scrollY : target.scrollTop
      const docHeight = target === window
        ? document.documentElement.scrollHeight - window.innerHeight
        : target.scrollHeight - target.clientHeight
      setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0)
    }
    update()
    target.addEventListener('scroll', update, { passive: true })
    return () => target.removeEventListener('scroll', update)
  }, [target])

  return (
    <div className={styles.track}>
      <div className={styles.bar} style={{ transform: `scaleX(${progress})` }} />
    </div>
  )
}
