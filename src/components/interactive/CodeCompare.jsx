import { useRef, useCallback } from 'react'
import styles from './CodeCompare.module.css'

/**
 * 代码对比组件
 * data: { before: string, after: string, lang?: string }
 */
export default function CodeCompare({ data }) {
  if (!data || !data.before || !data.after) return null

  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const syncing = useRef(false)

  const sync = useCallback((src, dst) => {
    if (syncing.current) return
    syncing.current = true

    requestAnimationFrame(() => {
      const pct = src.scrollTop / (src.scrollHeight - src.clientHeight)
      dst.scrollTop = pct * (dst.scrollHeight - dst.clientHeight)
      const pctX = src.scrollLeft / (src.scrollWidth - src.clientWidth)
      dst.scrollLeft = pctX * (dst.scrollWidth - dst.clientWidth)
      syncing.current = false
    })
  }, [])

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
        <span className={styles.label}>{data.beforeLabel || '改造前'}</span>
        <span className={styles.label}>{data.afterLabel || '改造后'}</span>
      </div>
      <div className={styles.grid}>
        <div ref={leftRef} className={styles.col} onScroll={() => sync(leftRef.current, rightRef.current)}>
          {beforeLines.map((line, i) => (
            <div key={i} className={[styles.line, diffs[i] === 'remove' || diffs[i] === 'change' ? styles.rem : ''].filter(Boolean).join(' ')}>
              <span className={styles.num}>{i + 1}</span>
              <span className={styles.code}>{line}</span>
            </div>
          ))}
        </div>
        <div className={styles.divider} />
        <div ref={rightRef} className={styles.col} onScroll={() => sync(rightRef.current, leftRef.current)}>
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
