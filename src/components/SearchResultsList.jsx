import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual'
import { highlightRanges } from '../utils/search.js'
import styles from './SearchResultsList.module.css'

const OVERSCAN = 5
const ESTIMATED_ROW_HEIGHT = 112

function HighlightedText({ text, ranges }) {
  return highlightRanges(text, ranges).map((part, index) => part.hit
    ? <mark key={index} className={styles.hit}>{part.text}</mark>
    : <span key={index}>{part.text}</span>)
}

/**
 * Measured search options; the active option stays mounted for aria-activedescendant.
 * @param {{results: Array, listId: string, optionId: Function, activeIndex: number,
 * onActiveIndexChange: Function, resultHref: Function, onClose: Function,
 * navigationRequest: {index: number, sequence: number}|null}} props
 */
export default function SearchResultsList({
  results, listId, optionId, activeIndex, onActiveIndexChange, resultHref, onClose, navigationRequest,
}) {
  const viewportRef = useRef(null)
  const readingAnchor = useRef(null)
  const getItemKey = useCallback(index => results[index].item.id, [results])
  const rangeExtractor = useCallback(range => {
    const indexes = defaultRangeExtractor(range)
    if (activeIndex >= 0 && activeIndex < results.length && !indexes.includes(activeIndex)) {
      indexes.push(activeIndex)
      indexes.sort((a, b) => a - b)
    }
    return indexes
  }, [activeIndex, results.length])
  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    getItemKey,
    overscan: OVERSCAN,
    rangeExtractor,
  })

  // Capture against the previous width before ResizeObserver updates row measurements.
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (readingAnchor.current && readingAnchor.current.width !== viewport.clientWidth) return
    const row = virtualizer.getVirtualItemForOffset(viewport.scrollTop)
    readingAnchor.current = row ? {
      index: row.index, offset: viewport.scrollTop - row.start, width: viewport.clientWidth,
    } : null
  })

  // Only explicit keyboard navigation scrolls. Hover and wheel never chase selection.
  useLayoutEffect(() => {
    if (navigationRequest && results.length) {
      virtualizer.scrollToIndex(navigationRequest.index, { align: 'auto', behavior: 'auto' })
    }
  }, [navigationRequest, results, virtualizer])

  useEffect(() => {
    const viewport = viewportRef.current
    let width = viewport.clientWidth
    let frame = 0
    /** Drop offscreen measurements after reflow, retaining the first visible row and offset. */
    const remeasure = () => {
      cancelAnimationFrame(frame)
      const anchor = readingAnchor.current
      const offset = anchor?.offset ?? 0
      virtualizer.measure()
      virtualizer.getTotalSize()
      const restoreAnchor = () => {
        // Explicit reflow measurements must also run while a scroll event is settling.
        viewport.querySelectorAll('[data-index]').forEach(node => {
          virtualizer.resizeItem(Number(node.dataset.index), node.offsetHeight)
        })
        virtualizer.getTotalSize()
        if (anchor) {
          const position = virtualizer.getOffsetForIndex(anchor.index, 'start')
          if (position) virtualizer.scrollToOffset(position[0] + offset, { behavior: 'auto' })
        }
      }
      restoreAnchor()
      frame = requestAnimationFrame(() => {
        restoreAnchor()
        if (anchor) readingAnchor.current = { ...anchor, width: viewport.clientWidth }
      })
    }
    const observer = new ResizeObserver(() => {
      if (viewport.clientWidth !== width) {
        width = viewport.clientWidth
        remeasure()
      }
    })
    observer.observe(viewport)
    document.fonts?.addEventListener('loadingdone', remeasure)
    return () => {
      observer.disconnect()
      document.fonts?.removeEventListener('loadingdone', remeasure)
      cancelAnimationFrame(frame)
    }
  }, [virtualizer, results])

  return (
    <div ref={viewportRef} className={styles.viewport} id={listId} role="listbox" aria-label="搜索结果">
      <div className={styles.canvas} style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(row => {
          const result = results[row.index]
          return (
            <a
              key={row.key}
              ref={virtualizer.measureElement}
              data-index={row.index}
              data-last={row.index === results.length - 1}
              id={optionId(result.item)}
              className={`${styles.item} ${row.index === activeIndex ? styles.itemActive : ''}`}
              style={{ transform: `translateY(${row.start}px)` }}
              href={resultHref(result)}
              role="option"
              tabIndex={-1}
              aria-selected={row.index === activeIndex}
              aria-posinset={row.index + 1}
              aria-setsize={results.length}
              onMouseMove={() => onActiveIndexChange(row.index)}
              onClick={event => {
                if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) onClose()
              }}
            >
              <span className={styles.itemTitle}>
                <HighlightedText text={result.item.title} ranges={result.titleRanges} />
              </span>
              {result.snippet.text && (
                <span className={styles.itemDesc}>
                  <HighlightedText text={result.snippet.text} ranges={result.snippet.ranges} />
                </span>
              )}
              {result.matchedTags.length > 0 && (
                <span className={styles.itemTags}>标签：{result.matchedTags.join('、')}</span>
              )}
            </a>
          )
        })}
      </div>
    </div>
  )
}
