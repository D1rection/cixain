import { useState, useEffect } from 'react'

const KEY = 'cixain-theme'

function getPreferred() {
  if (typeof window === 'undefined') return 'dark'
  const saved = localStorage.getItem(KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** 主题切换 hook，自动持久化到 localStorage */
export default function useTheme() {
  const [theme, setTheme] = useState(getPreferred)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(KEY, theme)
  }, [theme])

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggle }
}
