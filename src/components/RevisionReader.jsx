import { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-static'
import styles from './RevisionReader.module.css'

function formatRevisionDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || ''
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date).replace(/\//g, '-')
}

function labelFor(revision) {
  const date = formatRevisionDate(revision.committedAt)
  return date + ' · ' + (revision.shortId || revision.id?.slice(0, 7) || '版本')
}

function shortDateFor(revision) {
  return formatRevisionDate(revision.committedAt).replace(/^\d{4}-/, '')
}

function classNames(...names) {
  return names.filter(Boolean).join(' ')
}

/**
 * Collapsed revision history entry and vertical comparison timeline.
 * @param {{ revisions: Object[], compareId: string, comparison: Object|null, status: string, message?: string, onSelect: Function, onRetry: Function }} props
 */
export default function RevisionReader({ revisions, compareId, comparison, status, message, onSelect, onRetry }) {
  const selectedValue = revisions.some(revision => revision.id === compareId) ? compareId : ''
  const [expanded, setExpanded] = useState(Boolean(compareId))
  const [changeIndex, setChangeIndex] = useState(0)
  const comparisonLabel = useMemo(() => {
    if (!comparison) return ''
    return formatRevisionDate(comparison.from?.committedAt) + ' → 当前版本'
  }, [comparison])
  const changes = comparison?.changes || []

  useEffect(() => {
    if (compareId) setExpanded(true)
  }, [compareId])

  useEffect(() => {
    setChangeIndex(0)
  }, [comparison, compareId])

  const jumpToChange = index => {
    const change = changes[index]
    if (!change || typeof document === 'undefined') return
    const target = document.getElementById(change.id)
    if (!target) return
    setChangeIndex(index)
    target.setAttribute('tabindex', '-1')
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' })
    target.focus({ preventScroll: true })
  }

  if (!revisions.length) return null

  const hasStatus = status !== 'latest'

  return (
    <section className={styles.reader} aria-label="文章修订历史">
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={expanded}
        aria-controls="revision-history-list"
        onClick={() => setExpanded(value => !value)}
      >
        <span className={styles.kicker}>修订历史</span>
        <span className={styles.count}>{revisions.length} 个历史版本</span>
        <span
          className={classNames(styles.chevron, expanded && styles.chevronOpen)}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: ChevronDown }}
        />
      </button>

      {expanded && (
        <div id="revision-history-list" className={styles.panel}>
          <div className={styles.timeline} role="group" aria-label="选择比较版本">
            <button
              type="button"
              className={classNames(styles.version, !selectedValue && styles.current)}
              aria-pressed={!selectedValue}
              onClick={() => onSelect('')}
            >
              <span className={styles.dot} aria-hidden="true" />
              <span>当前版本</span>
            </button>
            {revisions.map(revision => {
              const active = revision.id === selectedValue
              return (
                <button
                  key={revision.id}
                  type="button"
                  className={classNames(styles.version, active && styles.active)}
                  aria-label={'与 ' + labelFor(revision) + ' 比较'}
                  aria-pressed={active}
                  onClick={() => onSelect(revision.id)}
                >
                  <span className={styles.dot} aria-hidden="true" />
                  <span>{shortDateFor(revision)}</span>
                  <code>{revision.shortId || revision.id?.slice(0, 7)}</code>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {hasStatus && (
        <div id="revision-status" className={styles.status} aria-live="polite">
          {status === 'loading' && '正在载入修订…'}
          {status === 'ready' && (
            <>
              <span className={styles.statusText}>正在查看：{comparisonLabel}</span>
              <span className={styles.changeSummary}>
                {comparison?.changeCount || 0} 处变更
              </span>
              {changes.length > 0 && (
                <span className={styles.changeNav} aria-label="变更导航">
                  <button
                    type="button"
                    className={styles.changeButton}
                    disabled={changeIndex === 0}
                    onClick={() => jumpToChange(changeIndex - 1)}
                  >
                    上一处
                  </button>
                  <span className={styles.changePosition} aria-live="polite">
                    第 {changeIndex + 1} / {changes.length} 处
                  </span>
                  <button
                    type="button"
                    className={styles.changeButton}
                    disabled={changeIndex === changes.length - 1}
                    onClick={() => jumpToChange(changeIndex + 1)}
                  >
                    下一处
                  </button>
                </span>
              )}
              <button type="button" className={styles.reset} onClick={() => onSelect('')}>回到当前</button>
            </>
          )}
          {status === 'error' && (
            <>
              <span className={styles.statusText}>{message || '历史版本暂不可用'}</span>
              <button type="button" className={styles.reset} onClick={onRetry}>重试</button>
              <button type="button" className={styles.reset} onClick={() => onSelect('')}>回到当前</button>
            </>
          )}
        </div>
      )}
    </section>
  )
}
