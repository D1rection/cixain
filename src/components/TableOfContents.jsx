import { useState, useEffect, useRef } from 'react'
import styles from './TableOfContents.module.css'

const NAVBAR_H = 52

/**
 * 文章目录
 * @param {{ toc: Array<{id: string, text: string, level: number}>, contentRef: React.RefObject }} props
 */
export default function TableOfContents({ toc, contentRef }) {
  const [open, setOpen] = useState(true)
  const [activeId, setActiveId] = useState(null)
  const ticking = useRef(false)

  useEffect(() => {
    if (toc.length === 0) return

    const update = () => {
      const triggerY = window.innerHeight * 0.3
      let idx = 0

      for (let i = 0; i < toc.length; i++) {
        const el = document.getElementById(toc[i].id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= triggerY + NAVBAR_H) {
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
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [toc])

  const scrollTo = id => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (toc.length === 0) return null

  return (
    <nav className={styles.toc}>
      <button className={styles.toggle} onClick={() => setOpen(o => !o)}>
        <span className={styles.label}>目录</span>
        <span className={[styles.arrow, open && styles.arrowOpen].filter(Boolean).join(' ')}>▸</span>
      </button>
      {open && (
        <ul className={styles.list}>
          {toc.map(item => (
            <li key={item.id} className={item.level === 3 ? styles.sub : ''}>
              <a
                href={`#${item.id}`}
                className={[styles.link, activeId === item.id && styles.active].filter(Boolean).join(' ')}
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
