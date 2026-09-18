import { createContext, useContext, useEffect } from 'react'

export const ScrollTargetContext = createContext(null)

/** Return the active document or mobile container scroll target. */
export function useScrollTarget() {
  const context = useContext(ScrollTargetContext)
  if (!context) throw new Error('useScrollTarget must be used inside ScrollProvider')
  return context
}

/** Lock the active scroll target while a modal or preview is open. */
export function useScrollLock(active) {
  const { lock, unlock } = useScrollTarget()

  useEffect(() => {
    if (!active) return undefined
    lock()
    return unlock
  }, [active, lock, unlock])
}
