import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'wouter'
import Fuse from 'fuse.js'
import styles from './SearchOverlay.module.css'

/**
 * 搜索浮层
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [index, setIndex] = useState(null)
  const inputRef = useRef(null)
  const [, navigate] = useLocation()

  // 加载搜索索引
  useEffect(() => {
    if (!open) return
    fetch('/search-index.json')
      .then(r => r.json())
      .then(data => {
        setIndex(new Fuse(data, {
          keys: ['title', 'description', 'text'],
          threshold: 0.4,
          includeScore: true,
        }))
      })
      .catch(() => {})
  }, [open])

  // 搜索
  useEffect(() => {
    if (!index || !query.trim()) {
      setResults([])
      return
    }
    const res = index.search(query.trim())
    setResults(res.slice(0, 10))
  }, [query, index])

  // 自动聚焦
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const handleSelect = useCallback(slug => {
    onClose()
    navigate(`/blog/${slug}`)
  }, [onClose, navigate])

  // Escape 关闭
  useEffect(() => {
    if (!open) return
    const handler = e => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          className={styles.input}
          placeholder="搜索文章..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className={styles.results}>
          {results.length > 0 ? (
            results.map(r => (
              <button
                key={r.item.slug}
                className={styles.item}
                onClick={() => handleSelect(r.item.slug)}
              >
                <span className={styles.itemTitle}>{r.item.title}</span>
                {r.item.description && (
                  <span className={styles.itemDesc}>{r.item.description}</span>
                )}
              </button>
            ))
          ) : query.trim() && (
            <p className={styles.empty}>无匹配结果</p>
          )}
        </div>
      </div>
    </div>
  )
}
