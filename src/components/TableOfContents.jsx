import { useState, useEffect, useRef } from 'react'
import { Link } from 'wouter'
import styles from './TableOfContents.module.css'
import { routePath } from '../utils/routes.js'
import { useScrollTarget } from '../hooks/useScrollTarget.js'
import useTocScroll from '../hooks/useTocScroll.js'

const NAVBAR_H = 52

/**
 * 文章目录（顶部可挂系列上下文块）
 * @param {{ toc: Array<{id: string, text: string, level: number}>, contentRef: React.RefObject, series?: {name: string, pos: number, total: number} }} props
 */
export default function TableOfContents({ toc, contentRef, series }) {
  const [open, setOpen] = useState(true)
  const [activeId, setActiveId] = useState(null)
  const ticking = useRef(false)
  const { target } = useScrollTarget()
  const scrollTo = useTocScroll(contentRef, target, toc)

  useEffect(() => {
    if (toc.length === 0 || !target) return

    const navHeight = () => document.querySelector('nav[aria-label="主导航"]')?.getBoundingClientRect().height || NAVBAR_H

    const update = () => {
      let idx = 0
      let minDist = Infinity

      for (let i = 0; i < toc.length; i++) {
        const el = document.getElementById(toc[i].id)
        if (!el) continue
        const dist = Math.abs(el.getBoundingClientRect().top - navHeight())
        if (dist < minDist) {
          minDist = dist
          idx = i
        }
      }

      setActiveId(toc[idx].id)
      ticking.current = false
    }

    const onScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(update)
        ticking.current = true
      }
    }

    onScroll()
    target.addEventListener('scroll', onScroll, { passive: true })
    return () => target.removeEventListener('scroll', onScroll)
  }, [toc, target])

  if (toc.length === 0 && !series) return null

  return (
    <nav className={styles.toc}>
      {series && (
        <div className={styles.series}>
          <div className={styles.seriesHead}>
            <Link
              className={styles.seriesName}
              href={routePath(`/series/${encodeURIComponent(series.name)}`)}
            >
              {series.name}
            </Link>
            <span className={styles.seriesFraction}>{series.pos}/{series.total}</span>
          </div>
          <div className={styles.seriesBar}>
            <span
              className={styles.seriesFill}
              style={{ width: `${(series.pos / series.total) * 100}%` }}
            />
          </div>
        </div>
      )}
      <button className={styles.toggle} onClick={() => setOpen(o => !o)}>
        <span className={styles.label}>目录</span>
        <span className={[styles.arrow, open && styles.arrowOpen].filter(Boolean).join(' ')}>▸</span>
      </button>
      {open && (
        <ul className={styles.list}>
          {toc.map(item => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={[styles.link, activeId === item.id && styles.active].filter(Boolean).join(' ')}
                style={{ paddingLeft: Math.max(0, (item.level - 2) * 18) }}
                onClick={e => { e.preventDefault(); scrollTo(item.id) }}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}
