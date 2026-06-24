import { Link, useLocation } from 'wouter'
import { SITE } from '../config.js'
import { useBlogData } from '../hooks/useBlogData.js'
import styles from './Sidebar.module.css'

/** 右侧栏：分类、标签、简介 */
export default function Sidebar() {
  const [location] = useLocation()
  const { posts = [] } = useBlogData()
  const params = new URLSearchParams(location.split('?')[1] || '')
  const activeCat = params.get('category')

  // 从文章数据提取所有标签去重
  const allTags = [...new Set(posts.flatMap(p => p.tags))].sort()

  return (
    <aside className={styles.sidebar}>
      {/* 分类 */}
      <div className={styles.section}>
        <p className={styles.heading}>分类</p>
        {SITE.categories.map(([label, slug]) => (
          <Link
            key={label}
            href={slug ? `/?category=${slug}` : '/'}
            className={`${styles.catLink} ${(!slug && !activeCat) || activeCat === slug ? styles.catActive : ''}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* 标签 */}
      {allTags.length > 0 && (
        <div className={styles.section}>
          <p className={styles.heading}>标签</p>
          <div className={styles.tags}>
            {allTags.map(tag => (
              <Link key={tag} href={`/?tag=${tag}`} className={styles.tag}>
                {tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 简介 */}
      <div className={styles.section}>
        <p className={styles.heading}>关于</p>
        <p className={styles.introName}>{SITE.author}</p>
        <p className={styles.intro}>{SITE.description}</p>
      </div>
    </aside>
  )
}
