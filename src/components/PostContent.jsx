import styles from './PostContent.module.css'

export default function PostContent({ html }) {
  return (
    <div
      className={styles.content}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
