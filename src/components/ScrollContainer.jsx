import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ScrollTargetContext } from '../hooks/useScrollTarget.js'
import styles from './ScrollContainer.module.css'

/**
 * Provides the page's active scroll target and keeps the scroll owner
 * separate from the document viewport.
 */
export function ScrollProvider({ children }) {
  const containerRef = useRef(null)
  const lockCount = useRef(0)
  const lockState = useRef(null)
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    setReady(true)
  }, [])

  const getTarget = useCallback(() => containerRef.current, [])

  const applyLock = useCallback(target => {
    if (!target) return null
    const state = {
      target,
      overflowY: target.style.overflowY,
    }
    target.style.overflowY = 'hidden'
    return state
  }, [])

  const restoreLock = useCallback(state => {
    if (!state) return
    state.target.style.overflowY = state.overflowY
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
    // A modal may request a lock before the container ref becomes available.
    if (ready && lockCount.current > 0 && !lockState.current) {
      lockState.current = applyLock(getTarget())
    }
  }, [applyLock, getTarget, ready])

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
 * The main vertical scroll owner at every viewport width.
 */
export default function ScrollContainer({ children }) {
  const context = useContext(ScrollTargetContext)
  if (!context) throw new Error('ScrollContainer must be used inside ScrollProvider')
  const { containerRef } = context
  return (
    <div ref={containerRef} className={styles.container} role="region" aria-label="页面内容" tabIndex={0}>
      {children}
    </div>
  )
}
