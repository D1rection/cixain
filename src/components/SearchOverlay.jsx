import { useState, useEffect, useMemo, useRef, useCallback, useId } from 'react'
import Fuse from 'fuse.js'
import styles from './SearchOverlay.module.css'
import { useScrollLock } from '../hooks/useScrollTarget.js'
import SearchResultsList from './SearchResultsList.jsx'
import { searchDocuments } from '../utils/search.js'

let cachedDocuments = null

function validateIndex(value) {
  if (value?.schemaVersion !== 1 || !Array.isArray(value.documents)) {
    throw new Error('搜索索引版本不兼容')
  }
  const ids = new Set()
  for (const item of value.documents) {
    if (!item.id || !item.url || !item.title || !Array.isArray(item.sections)) {
      throw new Error('搜索索引内容不完整')
    }
    if (ids.has(item.id)) throw new Error('搜索索引包含重复内容')
    ids.add(item.id)
  }
  return value.documents
}

/** Search published articles and fragments from the static full-text index. */
export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [documents, setDocuments] = useState(cachedDocuments)
  const [status, setStatus] = useState(cachedDocuments ? 'ready' : 'idle')
  const [retry, setRetry] = useState(0)
  const [navigationRequest, setNavigationRequest] = useState(null)
  const instanceId = useId()
  const listId = `${instanceId}-results`
  const optionId = item => `${instanceId}-result-${encodeURIComponent(item.id)}`
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const dialogRef = useRef(null)
  const priorFocus = useRef(null)
  const composing = useRef(false)
  useScrollLock(open)

  useEffect(() => {
    if (!open) return undefined
    if (cachedDocuments) {
      setDocuments(cachedDocuments)
      setStatus('ready')
      return undefined
    }
    const controller = new AbortController()
    let active = true
    setStatus('loading')
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    fetch(`${base}/search-index.json`, { signal: controller.signal, cache: 'no-cache' })
      .then(response => {
        if (!response.ok) throw new Error(`搜索索引加载失败（${response.status}）`)
        return response.json()
      })
      .then(validateIndex)
      .then(value => {
        if (!active) return
        cachedDocuments = value
        setDocuments(value)
        setStatus('ready')
      })
      .catch(error => {
        if (active && error.name !== 'AbortError') setStatus('error')
      })
    return () => { active = false; controller.abort() }
  }, [open, retry])

  useEffect(() => {
    if (open) {
      priorFocus.current = document.activeElement
      const timer = window.setTimeout(() => inputRef.current?.focus(), 50)
      return () => window.clearTimeout(timer)
    }
    if (priorFocus.current?.isConnected) priorFocus.current.focus()
    return undefined
  }, [open])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setNavigationRequest(null)
      setActiveIndex(0)
    }
  }, [open])

  const fuzzyIndex = useMemo(() => documents ? new Fuse(documents, {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'slug', weight: 0.6 },
      { name: 'tags', weight: 1 },
    ],
    threshold: 0.28,
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeScore: true,
  }) : null, [documents])

  const results = useMemo(() => status === 'ready' && documents
    ? searchDocuments(documents, query, fuzzyIndex)
    : [], [documents, fuzzyIndex, query, status])

  const selectResult = useCallback(result => {
    if (!result) return
    onClose()
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    const path = result.url.startsWith('/') ? result.url : `/${result.url}`
    window.location.assign(base && !path.startsWith(`${base}/`) ? `${base}${path}` : path)
  }, [onClose])

  const resultHref = result => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    const path = result.url.startsWith('/') ? result.url : `/${result.url}`
    return base && !path.startsWith(`${base}/`) ? `${base}${path}` : path
  }

  useEffect(() => {
    if (!open) return undefined
    const handler = event => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleKeyDown = event => {
    if (event.key === 'Tab') {
      const focusable = [...(dialogRef.current?.querySelectorAll('input:not([disabled]), button:not([disabled]), a[href]') || [])].filter(element => element.tabIndex >= 0)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!focusable.includes(document.activeElement)) {
        event.preventDefault()
        const target = event.shiftKey ? last : first
        target.focus()
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
      return
    }
    if (event.target !== inputRef.current || event.nativeEvent?.isComposing || composing.current) return
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && results.length) {
      event.preventDefault()
      const index = Math.max(0, Math.min(results.length - 1, activeIndex + (event.key === 'ArrowDown' ? 1 : -1)))
      setActiveIndex(index)
      setNavigationRequest(previous => ({ index, sequence: (previous?.sequence ?? 0) + 1 }))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      selectResult(results[activeIndex] || results[0])
    }
  }

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <section
        ref={dialogRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-title"
        onClick={event => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.titleRow}>
          <h2 id="search-title" className={styles.visuallyHidden}>站内搜索</h2>
          <button className={styles.close} type="button" aria-label="关闭搜索" onClick={onClose}>×</button>
        </div>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          role="combobox"
          aria-label="站内搜索"
          aria-autocomplete="list"
          aria-expanded={!!query.trim() && results.length > 0}
          aria-controls={listId}
          aria-activedescendant={results[activeIndex] ? optionId(results[activeIndex].item) : undefined}
          placeholder="输入关键词..."
          value={query}
          onChange={event => { setQuery(event.target.value); setActiveIndex(0); setNavigationRequest(null) }}
          onCompositionStart={() => { composing.current = true }}
          onCompositionEnd={() => { composing.current = false }}
        />
        <div className={styles.results}>
          {status === 'loading' && <p className={styles.status} role="status">正在加载索引…</p>}
          {status === 'error' && (
            <div className={styles.status} role="alert">
              <p>搜索暂时不可用，请检查网络后重试。</p>
              <button className={styles.retry} onClick={() => { cachedDocuments = null; setDocuments(null); setRetry(value => value + 1) }}>重试</button>
            </div>
          )}
          {status === 'ready' && !query.trim() && (
            <p className={styles.status} role="status">输入关键词开始搜索</p>
          )}
          {status === 'ready' && query.trim() && results.length === 0 && (
            <p className={styles.status} role="status">没有匹配结果</p>
          )}
        </div>
        {status === 'ready' && !!query.trim() && results.length > 0 && (
          <p className={styles.count} role="status">共 {results.length} 条结果</p>
        )}
        <SearchResultsList
          key={`${query}:${status}:${retry}`}
          results={results}
          listId={listId}
          optionId={optionId}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
          resultHref={resultHref}
          onClose={onClose}
          navigationRequest={navigationRequest}
        />
      </section>
    </div>
  )
}
