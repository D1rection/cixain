import { useEffect } from 'react'

// 块 id 字符集与构建期一致：[A-Za-z0-9_-]+（Obsidian ^id 剥 ^ 后）
const HASH_RE = /^#([A-Za-z0-9_-]+)$/

/**
 * 跨文章块引用定位：内容就绪 + 懒加载图片落定后，滚动到 location.hash 对应块并短暂高亮。
 * SPA 下浏览器原生锚点跳转会因内容异步注入而失效（内容渲染后不会自动补跳），必须主动定位；
 * hashchange 监听覆盖同文自引用 / 浏览器前进后退。
 * @param {string} readySignal 内容就绪依赖（渲染后的 HTML 字符串）
 * @param {React.RefObject<HTMLElement>} contentRef 内容容器（用于收集待加载图片）
 * @param {string} flashClass 高亮类（CSS Modules 局部类）
 */
export default function useHashScroll(readySignal, contentRef, flashClass) {
  useEffect(() => {
    if (!readySignal) return
    let done = false
    let timer = 0
    let imgListeners = []

    const removeImgListeners = () => {
      imgListeners.forEach(([img, fn]) => img.removeEventListener('load', fn))
      imgListeners = []
    }

    const locate = (id) => {
      if (done) return
      const el = document.getElementById(id)
      if (!el) return
      done = true
      // 目标块置于视口垂直中心（用户偏好：顶对齐 60px 不如居中直观）
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add(flashClass)
      setTimeout(() => el.classList.remove(flashClass), 2000)
    }

    const tryLocate = (id) => {
      // 等懒加载图片落定再定位：图片加载改变文章高度，提前滚动会停错位置
      const imgs = contentRef.current
        ? Array.from(contentRef.current.querySelectorAll('img.lazy:not(.loaded)'))
        : []
      if (!imgs.length) {
        locate(id)
        return
      }
      let finished = false
      const finish = () => {
        if (finished) return
        finished = true
        clearTimeout(timer)
        removeImgListeners()
        locate(id)
      }
      imgs.forEach((img) => {
        // 已缓存完成的图不再挂监听（complete 恒 true 不会触发 load）
        if (img.complete) {
          finish()
          return
        }
        img.addEventListener('load', finish, { once: true })
        imgListeners.push([img, finish])
      })
      timer = setTimeout(finish, 800) // 兜底：图片加载慢不阻塞定位
    }

    const onHash = () => {
      const m = window.location.hash.match(HASH_RE)
      if (!m) return
      done = false
      requestAnimationFrame(() => tryLocate(m[1]))
    }

    onHash()
    window.addEventListener('hashchange', onHash)
    return () => {
      window.removeEventListener('hashchange', onHash)
      clearTimeout(timer)
      removeImgListeners()
      done = true
    }
  }, [readySignal, flashClass])
}