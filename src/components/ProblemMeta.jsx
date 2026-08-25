import styles from './ProblemMeta.module.css'

/**
 * 题目基础信息条：终端窗口语汇（标题栏 + 提示符链式信息行，一行一条），
 * 与站点占位图/文章底部 `$ cat ../prev` 的终端身份一致。
 * frontmatter 平铺 meta（source / difficulty / url）驱动，任一存在即渲染。
 */
export default function ProblemMeta({ meta }) {
  const { source, difficulty, url } = meta || {}
  if (!source && !difficulty && !url) return null

  // 窗口名 = 标题前缀的题号（LC-231 → lc-231.info），与来源平台无关
  const idToken = (meta.title || '').split(/\s+/)[0].toLowerCase() || 'problem'
  const winName = idToken + '.info'

  // 难度色标仅命中 LC 三档，其余难度文案降级为普通文本
  const diffClass =
    difficulty === 'Easy' ? styles.diffEasy
      : difficulty === 'Medium' ? styles.diffMedium
        : difficulty === 'Hard' ? styles.diffHard
          : null

  // 信息行列表：行内容与 key（渲染时判是否最后一行以追加光标）
  const rows = []
  if (source) {
    rows.push({
      key: 'source',
      content: (
        <>
          <span className={styles.prompt}>$</span>
          <span className={styles.key}>source</span>
          <span className={styles.value}>{source}</span>
        </>
      ),
    })
  }
  if (difficulty) {
    rows.push({
      key: 'difficulty',
      content: (
        <>
          <span className={styles.prompt}>$</span>
          <span className={styles.key}>difficulty</span>
          <span className={[styles.value, diffClass].filter(Boolean).join(' ')}>
            {difficulty}
          </span>
        </>
      ),
    })
  }
  if (url) {
    rows.push({
      key: 'open',
      content: (
        <a className={styles.link} href={url} target="_blank" rel="noopener noreferrer">
          <span className={styles.prompt}>$</span>
          <span className={styles.key}>open</span>
          {/* URL 与 ↗ 同进同退：整体换行，光标贴 URL 末行，不独占一行 */}
          <span className={styles.wrap}>
            <span className={styles.urlText}>{url}</span>
            <span className={styles.urlArrow}>↗</span>
            <span className={styles.cursor} aria-hidden="true" />
          </span>
        </a>
      ),
    })
  }

  return (
    <aside className={styles.win}>
      <header className={styles.bar}>
        <span className={styles.dots} aria-hidden="true">
          <i className={styles.dotRed} />
          <i className={styles.dotYellow} />
          <i className={styles.dotGreen} />
        </span>
        <span className={styles.name}>{winName}</span>
      </header>
      <div className={styles.body}>
        {rows.map((row, i) => (
          <div key={row.key} className={styles.row}>
            {row.content}
            {/* 无 URL 行时，光标贴最后一行值后收尾 */}
            {i === rows.length - 1 && !url && <span className={styles.cursor} aria-hidden="true" />}
          </div>
        ))}
      </div>
    </aside>
  )
}