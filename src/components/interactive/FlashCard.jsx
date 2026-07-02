import { useState } from 'react'
import styles from './FlashCard.module.css'

/**
 * 闪卡组件
 * data: { front: string, back: string }
 */
export default function FlashCard({ data }) {
  const [flipped, setFlipped] = useState(false)
  const [anim, setAnim] = useState('')

  if (!data || !data.front || !data.back) return null

  const handleFlip = () => {
    setAnim(styles.compress)
    setTimeout(() => {
      setFlipped(v => !v)
      setAnim(styles.decompress)
      setTimeout(() => setAnim(''), 120)
    }, 120)
  }

  return (
    <div className={styles.wrap}>
      <div className={[styles.card, anim].filter(Boolean).join(' ')} onClick={handleFlip}>
        <div className={[styles.face, flipped ? styles.hidden : ''].filter(Boolean).join(' ')}>
          <span className={styles.prompt}>?</span>
          <p className={styles.text}>{data.front}</p>
          <p className={styles.hint}>点击显示答案</p>
        </div>
        <div className={[styles.face, styles.backFace, !flipped ? styles.hidden : ''].filter(Boolean).join(' ')}>
          <p className={styles.text}>{data.back}</p>
          <p className={styles.hint}>点击返回</p>
        </div>
      </div>
    </div>
  )
}
