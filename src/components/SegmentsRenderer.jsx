import { useEffect, useMemo } from 'react'
import TabGroup from './interactive/TabGroup.jsx'
import CodeCompare from './interactive/CodeCompare.jsx'
import FlashCard from './interactive/FlashCard.jsx'
import { updateLazyLoad } from '../utils/lazyImages.js'

const COMPONENTS = {
  TabGroup,
  CodeCompare,
  FlashCard,
}

/**
 * 普通 HTML 片段容器。
 * dangerouslySetInnerHTML 的对象引用必须跨渲染稳定：React 19 的 diffProperties
 * 对 dangerouslySetInnerHTML 不做值比较，引用变化就无条件重设 innerHTML，
 * 重建全部子节点——懒加载图片会被重置回占位态（表现为灯箱开关后图片消失）。
 */
function HtmlSegment({ content }) {
  const html = useMemo(() => ({ __html: content }), [content])
  return <div dangerouslySetInnerHTML={html} />
}

/** 渲染文章片段：普通 HTML 或交互组件 */
export default function SegmentsRenderer({ segments }) {
  // 安全网：内容重渲染提交后重扫懒加载 DOM，防止任何路径重建节点后停在占位态
  useEffect(() => {
    updateLazyLoad()
  })

  return segments.map((seg, i) => {
    if (seg.type === 'component') {
      const Component = COMPONENTS[seg.name]
      return Component ? <Component key={i} data={seg.data} /> : null
    }
    return <HtmlSegment key={i} content={seg.content} />
  })
}
