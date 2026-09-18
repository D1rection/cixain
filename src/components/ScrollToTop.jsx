import { useLayoutEffect } from 'react'
import { useLocation } from 'wouter'
import { useScrollTarget } from '../hooks/useScrollTarget.js'

/** 路由切换时滚动回顶部；带 hash 的锚点跳转不拦截 */
export default function ScrollToTop() {
  const [location] = useLocation()
  const { target } = useScrollTarget()

  useLayoutEffect(() => {
    if (!target) return
    if (window.location.hash) return
    target.scrollTo(0, 0)
  }, [location, target])

  return null
}
