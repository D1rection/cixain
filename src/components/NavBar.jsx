import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'wouter'
import { SITE } from '../config.js'
import styles from './NavBar.module.css'

const TEXTS = ["Cicada's blog", 'cixain']
const TYPING_SPEED = 80
const DELETING_SPEED = 40
const PAUSE = 2000

/** 顶部导航栏：品牌 logo + 页面链接 + 主题切换 */
export default function NavBar({ theme, onToggle, onSearch }) {
  const [menuOpen, setMenuOpen] = useState(false)
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
            <button className={styles.themeBtn} onClick={onToggle}>
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
