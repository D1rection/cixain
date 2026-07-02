/**
 * 从 processedHtml 中提取交互组件片段
 * @param {string} html - 含 <div data-interactive> 标记的 HTML
 * @returns {Array<{type: 'html'|'component', content?: string, name?: string, data?: any}>}
 */
const RE = /<div\s+data-interactive="([^"]+)"[^>]*data-code="([^"]*)"[^>]*><\/div>/g

export default function parseSegments(html) {
  if (!html) return []
  const segments = []
  let last = 0, match

  while ((match = RE.exec(html)) !== null) {
    const before = html.slice(last, match.index)
    if (before.trim()) segments.push({ type: 'html', content: before })

    try {
      const raw = match[2].replace(/&#x22;/g, '"').replace(/&quot;/g, '"')
      const data = JSON.parse(JSON.parse(raw).code)
      segments.push({ type: 'component', name: match[1], data })
    } catch {}

    last = RE.lastIndex
  }

  const rest = html.slice(last)
  if (rest.trim()) segments.push({ type: 'html', content: rest })

  return segments
}
