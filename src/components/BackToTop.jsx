import { useLocation } from 'wouter'
import styles from './BackToTop.module.css'
import { useScrollTarget } from '../hooks/useScrollTarget.js'
import useScrolledFromTop from '../hooks/useScrolledFromTop.js'

/** 右下角回到顶部按钮：与顶部导航共用「离开顶部」的判定 */
export default function BackToTop() {
  const { target } = useScrollTarget()
  const [location] = useLocation()
  const visible = useScrolledFromTop(target, location)

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
