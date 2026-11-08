import { useEffect, useState } from 'react'

// 两个阈值成对出现，形成滞回区间；只调大其中一个会让边界重新抖动。
const COLLAPSE_AT = 8
const EXPAND_AT = 2

/**
 * 页面是否已经离开顶部。导航收起与右下角回到顶部按钮共用这一份判定。
 *
 * @param {Window|HTMLElement|null} target 当前页面的滚动目标。
 * @param {unknown} resetKey 变化时复位为展开态（路由切换），避免新页面首帧沿用上一页的收起态。
 * @returns {boolean} 滚动距离超过收起阈值后为 true。
 */
export default function useScrolledFromTop(target, resetKey) {
  const [state, setState] = useState({ key: resetKey, scrolled: false })

  // 渲染期复位：等 effect 落地会晚一帧，新页面会先收起再展开。
  if (state.key !== resetKey) {
    setState({ key: resetKey, scrolled: false })
  }

  useEffect(() => {
    if (!target) return undefined

    let frame = 0
    const read = () => {
      frame = 0
      const y = target === window ? window.scrollY : target.scrollTop
      setState(prev => {
        if (!prev.scrolled && y > COLLAPSE_AT) return { ...prev, scrolled: true }
        if (prev.scrolled && y <= EXPAND_AT) return { ...prev, scrolled: false }
        return prev
      })
    }
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(read)
    }

    read()
    target.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      target.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [target])

  return state.scrolled
}
