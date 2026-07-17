import styles from './Footer.module.css'

const RSS_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="4" cy="20" r="3"/>
    <path d="M21 20h-3A12 12 0 0 0 6 8V5a15 15 0 0 1 15 15z"/>
    <path d="M17 20h-3a8 8 0 0 0-8-8V9a11 11 0 0 1 11 11z"/>
  </svg>
)

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.text}>
        <a href="/feed.xml" className={styles.rss} aria-label="RSS Feed">{RSS_ICON}</a>
        &copy; 2026 Cicada
        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" className={styles.license} target="_blank" rel="noopener">CC BY-NC-SA 4.0</a>
      </p>
    </footer>
  )
}
