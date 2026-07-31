import { useLayoutEffect } from 'react'
import { useLocation } from 'wouter'

/** 路由切换时滚动回顶部；带 hash 的锚点跳转不拦截 */
export default function ScrollToTop() {
  const [location] = useLocation()

  useLayoutEffect(() => {
    if (window.location.hash) return
    window.scrollTo(0, 0)
  }, [location])

  return null
}
