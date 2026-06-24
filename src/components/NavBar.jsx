import { Link, useLocation } from 'wouter'
import { SITE } from '../config.js'
import styles from './NavBar.module.css'

/** 顶部导航栏：品牌 logo + 分类链接 + 主题切换 */
export default function NavBar({ theme, onToggle }) {
  const [location] = useLocation()

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          cixain
        </Link>

        <div className={styles.links}>
          {SITE.categories.map(([label, slug]) => {
            const href = slug ? `/?category=${slug}` : '/'
            const isActive = slug
              ? location === href
              : location === '/' || (!location.includes('?category=') && !location.includes('/blog/') && !location.includes('/about'))

            return (
              <Link
                key={label}
                href={href}
                className={`${styles.link} ${isActive ? styles.active : ''}`}
              >
                {label}
              </Link>
            )
          })}
          <Link href="/about" className={`${styles.link} ${location === '/about' ? styles.active : ''}`}>
            关于
          </Link>
          <button className={styles.themeBtn} onClick={onToggle}>
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </div>
    </nav>
  )
}
