import styles from './PostContent.module.css'

/** 渲染编译后的文章 HTML（含 shiki 代码高亮） */
export default function PostContent({ html }) {
  return (
    <div
      className={styles.content}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
