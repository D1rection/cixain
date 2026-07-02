import { useState } from 'react'
import styles from './TabGroup.module.css'

/**
 * 标签页组件
 * data: [{ label: string, content: string }]
 */
export default function TabGroup({ data }) {
  const [active, setActive] = useState(0)
  const tabs = Array.isArray(data) ? data : []

  if (tabs.length === 0) return null

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs}>
        {tabs.map((tab, i) => (
          <button
            key={i}
            className={[styles.tab, i === active && styles.active].filter(Boolean).join(' ')}
            onClick={() => setActive(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.panel}>
        {tabs[active].content}
      </div>
    </div>
  )
}
