import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'

/** 扫描 [data-interactive] 占位符，挂载交互组件 */
export default function InteractiveWrapper() {
  useEffect(() => {
    const placeholders = document.querySelectorAll('[data-interactive]')
    const roots = []

    placeholders.forEach(el => {
      const component = el.getAttribute('data-interactive')
      const root = createRoot(el)
      root.render(
        <div style={{ padding: 16, border: '1px dashed var(--color-border)', borderRadius: 8, textAlign: 'center', color: 'var(--color-muted)' }}>
          {component} 组件（待接入）
        </div>,
      )
      roots.push(root)
    })

    return () => roots.forEach(r => r.unmount())
  }, [])

  return null
}
