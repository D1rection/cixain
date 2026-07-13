import { useState, useEffect, useCallback, useRef } from 'react'

const KEY = 'cixain-theme'

/** 主题 hook，支持三态：auto / light / dark */
export default function useTheme() {
  const [saved, setSaved] = useState(null)
  const first = useRef(true)

  // 水合后从 DOM data-theme 同步（inline script 已正确设置）
  useEffect(() => {
    const t = document.documentElement.getAttribute('data-theme')
    if (t === 'light' || t === 'dark') setSaved(t)
  }, [])

  const theme = saved || (new Date().getHours() >= 6 && new Date().getHours() < 18 ? 'light' : 'dark')
  const mode = saved || 'auto'

  // 同步 theme 到 DOM，跳过首次水合（inline script 已正确处理）
  useEffect(() => {
    if (first.current) { first.current = false; return }
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const setTheme = useCallback(next => {
    if (next === 'auto') {
      localStorage.removeItem(KEY)
      setSaved(null)
    } else {
      localStorage.setItem(KEY, next)
      setSaved(next)
    }
  }, [])

  const toggle = useCallback(() => {
    if (!saved) setTheme('light')
    else if (saved === 'light') setTheme('dark')
    else setTheme('auto')
  }, [saved, setTheme])

  return { theme, mode, toggle }
}
