import { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'

export default function InteractiveWrapper({ containerRef }) {
  useEffect(() => {
    const parent = containerRef?.current || document
    const placeholders = parent.querySelectorAll('[data-interactive]')
    const roots = []

    placeholders.forEach(el => {
      const component = el.getAttribute('data-interactive')
      const root = createRoot(el)
      root.render(
        <div style={{ padding: 16, border: '1px dashed #d1d5db', borderRadius: 8, textAlign: 'center', color: '#6b7280' }}>
          {component} 组件（待接入）
        </div>,
      )
      roots.push(root)
    })

    return () => roots.forEach(r => r.unmount())
  }, [containerRef])

  return null
}
