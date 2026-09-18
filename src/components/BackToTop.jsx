import { useState, useEffect } from 'react'
import styles from './BackToTop.module.css'
import { useScrollTarget } from '../hooks/useScrollTarget.js'

const THRESHOLD = 300

/** 右下角回到顶部按钮 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false)
  const { target } = useScrollTarget()

  useEffect(() => {
    if (!target) return undefined
    const update = () => setVisible((target === window ? window.scrollY : target.scrollTop) > THRESHOLD)
    update()
    target.addEventListener('scroll', update, { passive: true })
    return () => target.removeEventListener('scroll', update)
  }, [target])

  const scrollToTop = () => target?.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <button
      className={[styles.btn, visible && styles.visible].filter(Boolean).join(' ')}
      onClick={scrollToTop}
      aria-label="回到顶部"
    >
      ↑
    </button>
  )
}
