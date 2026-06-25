import { useState, useEffect, useCallback } from 'react'

const KEY = 'cixain-theme'

function getHour() {
  return new Date().getHours()
}

function timeBasedTheme() {
  const h = getHour()
  return h >= 6 && h < 18 ? 'light' : 'dark'
}

function getStored() {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem(KEY)
  return saved === 'dark' || saved === 'light' ? saved : null
}

/** 主题 hook，支持三态：auto / light / dark */
export default function useTheme() {
  const [saved, setSaved] = useState(getStored)

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
