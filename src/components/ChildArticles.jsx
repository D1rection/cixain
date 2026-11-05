import { useId, useState } from 'react'
import { Link } from 'wouter'
import { ChevronDown } from 'lucide-static'
import styles from './ChildArticles.module.css'

/** Direct child links; mount keyed by the current post ID to reset on navigation.
 * @param {{articles: Object[]}} props
 */
export default function ChildArticles({ articles }) {
  const [expanded, setExpanded] = useState(false)
  const panelId = useId()
  if (!articles.length) return null
  return (
    <section className={styles.children} aria-label="子文章">
      <button type="button" className={styles.toggle} aria-expanded={expanded}
        aria-controls={panelId} onClick={() => setExpanded(value => !value)}>
        <span className={styles.label}>子文章</span>
        <span className={styles.count}>· {articles.length} 篇</span>
        <span className={`${styles.chevron} ${expanded ? styles.open : ''}`} aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: ChevronDown }} />
      </button>
      <ul id={panelId} className={styles.list} hidden={!expanded}>
        {articles.map(article => (
          <li key={article.id}>
            <Link href={article.contentUrl} className={styles.link}>{article.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
