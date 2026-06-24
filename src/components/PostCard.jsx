import { Link } from 'wouter'
import TagChip from './TagChip.jsx'
import styles from './PostCard.module.css'

/**
 * 文章卡片
 * @param {{ slug: string, title: string, date: string, description: string, category?: string, tags: string[] }} post
 */
export default function PostCard({ post }) {
  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <Link href={`/blog/${post.slug}`} className={styles.title}>
          {post.title}
        </Link>
        <span className={styles.date}>
          {new Date(post.date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
        </span>
      </div>
      <p className={styles.desc}>{post.description}</p>
      <div className={styles.tags}>
        {post.category && (
          <TagChip label={post.category} param="category" />
        )}
        {post.tags.map(tag => (
          <TagChip key={tag} label={tag} param="tag" />
        ))}
      </div>
    </article>
  )
}
