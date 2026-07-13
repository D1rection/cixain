import { useState, useEffect, useCallback } from 'react'

const KEY = 'cixain-theme'

function getHour() {
  return new Date().getHours()
}

function timeBasedTheme() {
  const h = getHour()
  return h >= 6 && h < 18 ? 'light' : 'dark'
}

/** 从 DOM data-theme 取初始值（inline script 已正确设置） */
function getInitialTheme() {
  if (typeof document === 'undefined') return null
  const t = document.documentElement.getAttribute('data-theme')
  return t === 'light' || t === 'dark' ? t : null
}

/** 主题 hook，支持三态：auto / light / dark */
export default function useTheme() {
  const [saved, setSaved] = useState(getInitialTheme)

  const theme = saved || timeBasedTheme()
  const mode = saved || 'auto'

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
    // auto → light → dark → auto
    if (!saved) setTheme('light')
    else if (saved === 'light') setTheme('dark')
    else setTheme('auto')
  }, [saved, setTheme])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return { theme, mode, toggle }
}
