import { Link } from 'wouter'
import TagChip from './TagChip.jsx'
import styles from './PostCard.module.css'

export default function PostCard({ post }) {
  return (
    <article className={styles.card}>
      <Link href={`/blog/${post.slug}`} className={styles.title}>
        {post.title}
      </Link>
      <p className={styles.date}>
        {new Date(post.date).toLocaleDateString('zh-CN')}
      </p>
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
