import { Link, useLocation } from 'wouter'
import { SITE } from '../config.js'
import styles from './NavBar.module.css'

/** 顶部导航栏：站点标题 + 分类导航链接 */
export default function NavBar() {
  const [location] = useLocation()

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          {SITE.title}
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
        </div>
      </div>
    </nav>
  )
}
