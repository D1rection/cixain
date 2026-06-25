import { useState, useEffect, useRef } from 'react'
import styles from './TableOfContents.module.css'

/**
 * 文章目录
 * @param {{ toc: Array<{id: string, text: string, level: number}>, contentRef: React.RefObject }} props
 */
export default function TableOfContents({ toc, contentRef }) {
  const [open, setOpen] = useState(true)
  const [activeId, setActiveId] = useState(null)
  const observer = useRef(null)

  useEffect(() => {
    if (toc.length === 0) return

    observer.current = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-52px 0px -75% 0px' }
    )

    requestAnimationFrame(() => {
      const container = contentRef?.current || document
      toc.forEach(({ id }) => {
        const el = container.querySelector(`#${CSS.escape(id)}`)
        if (el) observer.current.observe(el)
      })
    })

    return () => observer.current?.disconnect()
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
