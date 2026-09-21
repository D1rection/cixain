import { useCallback, useEffect, useRef } from 'react'

const ALIGN_TOLERANCE = 2
const ANIMATION_IDLE_MS = 180
const LAYOUT_STABLE_MS = 150
const NAVIGATION_TIMEOUT_MS = 3000

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getScrollMarginTop(element) {
  const margin = parseFloat(window.getComputedStyle(element).scrollMarginTop)
  return Number.isFinite(margin) ? margin : 0
}

function getScrollState(target, element) {
  const marginTop = getScrollMarginTop(element)
  const elementRect = element.getBoundingClientRect()

  if (target === window) {
    const scrollRoot = document.scrollingElement || document.documentElement
    const current = window.scrollY
    const max = Math.max(0, scrollRoot.scrollHeight - window.innerHeight)
    const desired = clamp(current + elementRect.top - marginTop, 0, max)
    return { current, desired }
  }

  const targetRect = target.getBoundingClientRect()
  const current = target.scrollTop
  const max = Math.max(0, target.scrollHeight - target.clientHeight)
  const desired = clamp(
    current + elementRect.top - targetRect.top - target.clientTop - marginTop,
    0,
    max,
  )
  return { current, desired }
}

function scrollTargetTo(target, top, behavior) {
  target.scrollTo({ top, behavior })
}

/**
 * Keep a TOC navigation aligned while lazy content settles.
 *
 * The first smooth scroll can start before images above the heading load. Those
 * images may change the heading's document position during the animation, so
 * the session performs bounded instant corrections after scrolling settles.
 * User input cancels the session immediately.
 *
 * @param {React.RefObject<HTMLElement>} contentRef Article content container.
 * @param {Window|HTMLElement|null} target Active page scroll target.
 * @param {Array} toc Current table of contents, used to cancel stale sessions.
 * @returns {(id: string) => void} Start a TOC navigation session.
 */
export default function useTocScroll(contentRef, target, toc) {
  const sessionRef = useRef(null)

  const cancel = useCallback(() => {
    const session = sessionRef.current
    if (!session) return
    session.cancelled = true
    if (session.phase === 'animating') {
      const current = session.target === window ? window.scrollY : session.target.scrollTop
      session.target.scrollTo({ top: current, behavior: 'auto' })
    }
    session.cleanups.forEach(cleanup => cleanup())
    session.cleanups = []
    if (session.animationTimer) clearTimeout(session.animationTimer)
    if (session.stableTimer) clearTimeout(session.stableTimer)
    if (session.timeout) clearTimeout(session.timeout)
    if (session.raf) cancelAnimationFrame(session.raf)
    session.observer?.disconnect()
    sessionRef.current = null
  }, [])

  useEffect(() => cancel, [cancel, target, toc])

  const scrollTo = useCallback((id) => {
    cancel()
    const content = contentRef.current
    if (!target || !content) return

    const element = Array.from(content.querySelectorAll('[id]')).find(node => node.id === id)
    if (!element) return

    const session = {
      cancelled: false,
      cleanups: [],
      observer: null,
      animationTimer: 0,
      stableTimer: 0,
      timeout: 0,
      raf: 0,
      phase: 'animating',
      target,
    }
    sessionRef.current = session

    const isCurrent = () => sessionRef.current === session && !session.cancelled
    const addCleanup = (cleanup) => session.cleanups.push(cleanup)
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

    const getState = () => {
      if (!element.isConnected || !content.contains(element)) return null
      return getScrollState(target, element)
    }

    const measure = () => {
      if (!isCurrent() || session.phase === 'animating') return
      const state = getState()
      if (!state) {
        cancel()
        return
      }
      if (Math.abs(state.desired - state.current) > ALIGN_TOLERANCE) {
        scrollTargetTo(target, state.desired, 'auto')
      }
    }

    const scheduleStableCheck = () => {
      if (!isCurrent() || session.phase === 'animating') return
      clearTimeout(session.stableTimer)
      session.stableTimer = setTimeout(() => {
        session.stableTimer = 0
        measure()
        if (!isCurrent()) return
        const state = getState()
        if (state && Math.abs(state.desired - state.current) <= ALIGN_TOLERANCE) {
          cancel()
        }
      }, LAYOUT_STABLE_MS)
    }

    const scheduleMeasure = () => {
      if (!isCurrent() || session.phase === 'animating' || session.raf) return
      session.raf = requestAnimationFrame(() => {
        session.raf = 0
        measure()
        scheduleStableCheck()
      })
    }

    const finishAnimation = () => {
      if (!isCurrent() || session.phase !== 'animating') return
      session.phase = 'settling'
      clearTimeout(session.animationTimer)
      session.animationTimer = 0
      measure()
      scheduleStableCheck()
    }

    const onScroll = () => {
      if (!isCurrent()) return
      if (session.phase === 'animating') {
        clearTimeout(session.animationTimer)
        session.animationTimer = setTimeout(finishAnimation, ANIMATION_IDLE_MS)
      } else {
        scheduleMeasure()
      }
    }

    const onLayoutChange = () => scheduleMeasure()
    const onAssetEvent = event => {
      if (event.target?.tagName === 'IMG') onLayoutChange()
    }
    const onUserInput = event => {
      if (event.type === 'keydown' && !['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) return
      cancel()
    }

    target.addEventListener('scroll', onScroll, { passive: true })
    addCleanup(() => target.removeEventListener('scroll', onScroll))
    target.addEventListener('scrollend', finishAnimation)
    addCleanup(() => target.removeEventListener('scrollend', finishAnimation))
    target.addEventListener('wheel', onUserInput, { passive: true })
    addCleanup(() => target.removeEventListener('wheel', onUserInput))
    target.addEventListener('touchstart', onUserInput, { passive: true })
    addCleanup(() => target.removeEventListener('touchstart', onUserInput))
    target.addEventListener('pointerdown', onUserInput, { passive: true })
    addCleanup(() => target.removeEventListener('pointerdown', onUserInput))
    window.addEventListener('keydown', onUserInput, true)
    addCleanup(() => window.removeEventListener('keydown', onUserInput, true))
    window.addEventListener('resize', onLayoutChange, { passive: true })
    addCleanup(() => window.removeEventListener('resize', onLayoutChange))
    content.addEventListener('load', onAssetEvent, true)
    content.addEventListener('error', onAssetEvent, true)
    addCleanup(() => content.removeEventListener('load', onAssetEvent, true))
    addCleanup(() => content.removeEventListener('error', onAssetEvent, true))

    if (typeof ResizeObserver !== 'undefined') {
      session.observer = new ResizeObserver(onLayoutChange)
      session.observer.observe(content)
      session.observer.observe(element)
      if (target !== window) session.observer.observe(target)
    }

    const initialState = getState()
    if (!initialState) {
      cancel()
      return
    }
    scrollTargetTo(target, initialState.desired, behavior)
    if (behavior === 'auto') finishAnimation()
    else session.animationTimer = setTimeout(finishAnimation, ANIMATION_IDLE_MS)
    session.timeout = setTimeout(() => {
      if (!isCurrent()) return
      if (session.phase !== 'animating') {
        measure()
        cancel()
      } else {
        cancel()
      }
    }, NAVIGATION_TIMEOUT_MS)
  }, [cancel, contentRef, target])

  return scrollTo
}
