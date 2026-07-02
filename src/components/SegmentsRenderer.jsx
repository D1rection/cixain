import TabGroup from './interactive/TabGroup.jsx'
import CodeCompare from './interactive/CodeCompare.jsx'
import FlashCard from './interactive/FlashCard.jsx'

const COMPONENTS = {
  TabGroup,
  CodeCompare,
  FlashCard,
}

/** 渲染文章片段：普通 HTML 或交互组件 */
export default function SegmentsRenderer({ segments }) {
  return segments.map((seg, i) => {
    if (seg.type === 'component') {
      const Component = COMPONENTS[seg.name]
      return Component ? <Component key={i} data={seg.data} /> : null
    }
    return <div key={i} dangerouslySetInnerHTML={{ __html: seg.content }} />
  })
}
