import Sidebar from './Sidebar.jsx'
import styles from './Layout.module.css'

/** 两栏布局：左内容 + 右侧栏（可选） */
export default function Layout({ children, sidebar }) {
  return (
    <div className={sidebar ? styles.layout : styles.wide}>
      <div className={styles.main}>{children}</div>
      {sidebar && <Sidebar />}
    </div>
  )
}
