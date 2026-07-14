import { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './ImagePreview.module.css'

export default function ImagePreview({ images, index, onClose }) {
  const [current, setCurrent] = useState(index)

  useEffect(() => {
    setCurrent(index)
  }, [index])

  const show = useCallback(delta => {
    setCurrent(i => {
      const next = i + delta
      if (next < 0 || next >= images.length) return i
      return next
    })
  }, [images.length])

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') show(-1)
      if (e.key === 'ArrowRight') show(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, show])

  const single = images.length <= 1

  return createPortal(
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <img className={styles.img} src={images[current]} alt="" />
      {!single && (
        <div className={styles.bar}>
          <button className={styles.nav} disabled={current === 0} onClick={() => show(-1)}>◀</button>
          <span className={styles.counter}>{current + 1} / {images.length}</span>
          <button className={styles.nav} disabled={current === images.length - 1} onClick={() => show(1)}>▶</button>
        </div>
      )}
    </div>,
    document.body
  )
}
