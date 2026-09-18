import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ScrollTargetContext } from '../hooks/useScrollTarget.js'
import styles from './ScrollContainer.module.css'

const MOBILE_QUERY = '(max-width: 768px)'

/**
 * Provides the page's active scroll target and keeps the mobile scroll owner
 * separate from the document viewport.
 */
export function ScrollProvider({ children }) {
  const containerRef = useRef(null)
  const lockCount = useRef(0)
  const lockState = useRef(null)
  const [ready, setReady] = useState(false)
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  ))

  useLayoutEffect(() => {
    setReady(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const media = window.matchMedia(MOBILE_QUERY)
    const onChange = e => setIsMobile(e.matches)
    media.addEventListener?.('change', onChange)
    return () => media.removeEventListener?.('change', onChange)
  }, [])

  const getTarget = useCallback(() => {
    if (isMobile && containerRef.current) return containerRef.current
    return typeof window !== 'undefined' ? window : null
  }, [isMobile, ready])

  const applyLock = useCallback(target => {
    if (!target) return null
    if (target === window) {
      document.body.classList.add('scroll-locked')
      return { type: 'window' }
    }

    const state = {
      type: 'container',
      target,
      overflowY: target.style.overflowY,
    }
    target.style.overflowY = 'hidden'
    return state
  }, [])

  const restoreLock = useCallback(state => {
    if (!state) return
    if (state.type === 'window') {
      document.body.classList.remove('scroll-locked')
    } else {
      state.target.style.overflowY = state.overflowY
    }
  }, [])

  const lock = useCallback(() => {
    lockCount.current += 1
    if (lockCount.current !== 1) return

    const target = getTarget()
    if (!target) return
    lockState.current = applyLock(target)
  }, [applyLock, getTarget])

  const unlock = useCallback(() => {
    if (lockCount.current === 0) return
    lockCount.current -= 1
    if (lockCount.current !== 0) return

    const state = lockState.current
    lockState.current = null
    restoreLock(state)
  }, [restoreLock])

  useEffect(() => {
    if (!ready || lockCount.current === 0 || !lockState.current) return
    const current = lockState.current
    const currentTarget = current.type === 'window' ? window : current.target
    const nextTarget = getTarget()
    if (!nextTarget || currentTarget === nextTarget) return
    restoreLock(current)
    lockState.current = applyLock(nextTarget)
  }, [applyLock, getTarget, isMobile, ready, restoreLock])

  const value = useMemo(() => ({
    containerRef,
    target: ready ? getTarget() : null,
    getTarget,
    lock,
    unlock,
  }), [getTarget, lock, unlock, ready])

  return <ScrollTargetContext.Provider value={value}>{children}</ScrollTargetContext.Provider>
}

/**
 * The only vertical scroll owner on mobile. Desktop deliberately keeps the
 * document as the scroll owner to preserve the existing desktop behavior.
 */
export default function ScrollContainer({ children }) {
  const context = useContext(ScrollTargetContext)
  if (!context) throw new Error('ScrollContainer must be used inside ScrollProvider')
  const { containerRef } = context
  return <div ref={containerRef} className={styles.container}>{children}</div>
}
