import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'wouter'
import { SITE, BG_COUNT } from '../config.js'
import styles from './NavBar.module.css'

const TEXTS = ["Cicada's blog", 'cixain']
const CDN = 'https://cdn.jsdelivr.net/gh/D1rection/img@main/images'
const BG_IMAGES = Array.from({ length: BG_COUNT }, (_, i) => `${CDN}/bg-${i}.png`)

function getBgIndex() {
  if (typeof localStorage === 'undefined') return 0
  const saved = localStorage.getItem('cixain-bg')
  if (saved === null) {
    return Math.floor(Date.now() / 86400000) % BG_IMAGES.length
  }
  return parseInt(saved, 10)
}
const TYPING_SPEED = 80
const DELETING_SPEED = 40
const PAUSE = 2000

const ICONS = {
  light: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>),
  dark: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>),
  auto: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg>),
}

/** 顶部导航栏：品牌 logo + 页面链接 + 主题切换 */
export default function NavBar({ theme, onToggle, onSearch, mode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [spin, setSpin] = useState(false)
  const [bgIndex, setBgIndex] = useState(getBgIndex)

  const handleBgToggle = () => {
    const next = (bgIndex + 1) % BG_IMAGES.length
    const root = document.documentElement
    const newUrl = BG_IMAGES[next]
    const oldBg = root.style.getPropertyValue('--bg-image')

    // 预加载后切换
    const img = new Image()
    img.onload = () => {
      // 先创建 overlay 覆盖页面（阻止新背景闪现）
      const overlay = document.createElement('div')
      overlay.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;background:' + (oldBg || 'var(--color-bg)') + ' center/cover;image-rendering:pixelated;box-shadow:inset 0 0 0 99999px color-mix(in srgb,var(--color-bg) 92%,transparent)'
      document.body.appendChild(overlay)

      // 再切换 CSS 背景（overlay 遮住了看不到切换）
      root.style.setProperty('--bg-image', `url(${newUrl})`)
      localStorage.setItem('cixain-bg', String(next))
      setBgIndex(next)

      // 50ms 后触发过渡（确保初始 opacity:1 已渲染）
      setTimeout(() => {
        overlay.style.transition = 'opacity .3s'
        overlay.style.opacity = '0'
      }, 20)
      setTimeout(() => overlay.remove(), 400)
    }
    img.src = newUrl
  }
  const [display, setDisplay] = useState('')
  const [location] = useLocation()
  const idx = useRef(0)
  const i = useRef(0)
  const deleting = useRef(false)

  useEffect(() => {
    const fn = () => {
      const word = TEXTS[idx.current]
      if (deleting.current) {
        i.current--
        setDisplay(word.slice(0, i.current))
        if (i.current === 0) {
          deleting.current = false
          idx.current = (idx.current + 1) % TEXTS.length
          setTimeout(fn, 200)
          return
        }
        setTimeout(fn, DELETING_SPEED)
      } else {
        i.current++
        setDisplay(word.slice(0, i.current))
        if (i.current > word.length) {
          deleting.current = true
          setTimeout(fn, PAUSE)
          return
        }
        setTimeout(fn, TYPING_SPEED)
      }
    }
    const t = setTimeout(fn, 500)
    return () => clearTimeout(t)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} onClick={closeMenu}>
          <span className={styles.typewriter}>{display}</span>
          <span className={styles.cursor}>▌</span>
        </Link>

        <button className={styles.hamburger} onClick={() => setMenuOpen(o => !o)} aria-label="菜单">
          <span className={[styles.bar, menuOpen && styles.barOpen].filter(Boolean).join(' ')} />
        </button>

        <div className={[styles.links, menuOpen && styles.linksOpen].filter(Boolean).join(' ')}>
          <Link href="/" className={[styles.link, location === '/' && styles.active].filter(Boolean).join(' ')} onClick={closeMenu}>
            首页
          </Link>
          <Link href="/about" className={[styles.link, location === '/about' && styles.active].filter(Boolean).join(' ')} onClick={closeMenu}>
            关于
          </Link>
          <div className={styles.actions}>
            {SITE.social.github && (
              <a href={SITE.social.github} target="_blank" rel="noopener noreferrer" className={styles.ghLink}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              </a>
            )}
            <button className={styles.searchBtn} onClick={() => { onSearch(); closeMenu() }} aria-label="搜索">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
            <button className={styles.themeBtn} onClick={() => { handleBgToggle(); closeMenu() }} aria-label="背景">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </button>
            <button suppressHydrationWarning className={styles.themeBtn} onClick={() => { setSpin(true); onToggle(); setTimeout(() => setSpin(false), 400) }} aria-label={`主题: ${mode}`}>
              <span suppressHydrationWarning className={[styles.themeIcon, spin && styles.spin].filter(Boolean).join(' ')}>{ICONS[mode]}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
