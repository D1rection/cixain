import styles from './CodeCompare.module.css'

/**
 * 代码对比组件
 * data: { before: string, after: string, lang?: string }
 */
export default function CodeCompare({ data }) {
  if (!data || !data.before || !data.after) return null

  const beforeLines = data.before.split('\n')
  const afterLines = data.after.split('\n')
  const maxLines = Math.max(beforeLines.length, afterLines.length)

  const diffs = []
  for (let i = 0; i < maxLines; i++) {
    const a = beforeLines[i]
    const b = afterLines[i]
    if (a === undefined) diffs.push('add')
    else if (b === undefined) diffs.push('remove')
    else if (a.trim() === b.trim()) diffs.push('same')
    else diffs.push('change')
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.label}>改造前</span>
        <span className={styles.label}>改造后</span>
      </div>
      <div className={styles.grid}>
        <div className={styles.col}>
          {beforeLines.map((line, i) => (
            <div key={i} className={[styles.line, diffs[i] === 'remove' || diffs[i] === 'change' ? styles.rem : ''].filter(Boolean).join(' ')}>
              <span className={styles.num}>{i + 1}</span>
              <span className={styles.code}>{line}</span>
            </div>
          ))}
        </div>
        <div className={styles.divider} />
        <div className={styles.col}>
          {afterLines.map((line, i) => (
            <div key={i} className={[styles.line, diffs[i] === 'add' || diffs[i] === 'change' ? styles.add : ''].filter(Boolean).join(' ')}>
              <span className={styles.num}>{i + 1}</span>
              <span className={styles.code}>{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
