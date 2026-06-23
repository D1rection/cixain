import PostCard from './PostCard.jsx'
import styles from './PostList.module.css'

export default function PostList({ posts }) {
  if (posts.length === 0) {
    return (
      <div className={styles.list}>
        <p className={styles.empty}>暂无文章</p>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {posts.map(post => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  )
}
