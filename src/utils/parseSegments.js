/**
 * 从 processedHtml 中提取交互组件片段
 * @param {string} html - 含 <div data-interactive> 标记的 HTML
 * @returns {Array<{type: 'html'|'component', content?: string, name?: string, data?: any}>}
 */
const RE = /<div\s+data-interactive="([^"]+)"[^>]*data-code="([^"]*)"[^>]*><\/div>/g

function htmlDecode(str) {
  return str
    .replace(/&#x22;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&#x60;/g, '`')
    .replace(/&#x27;/g, "'")
}

function parseTabGroup(code) {
  const tabs = []
  const parts = ('\n' + code + '\n').split(/\n--(.+?)--\n/)
  for (let i = 1; i < parts.length; i += 2) {
    tabs.push({
      label: parts[i].trim(),
      content: (parts[i + 1] || '').trim(),
    })
  }
  return tabs
}

function splitBySeparator(code) {
  const parts = code.split(/\n\s*-{3,}\s*\n/)
  return [parts[0] || '', parts[1] || ''].map(s => s.trim())
}

function parseCodeCompare(code) {
  const [before, after] = splitBySeparator(code)
  return { before, after }
}

function parseFlashCard(code) {
  const [front, back] = splitBySeparator(code)
  return { front, back }
}

const PARSERS = {
  TabGroup: parseTabGroup,
  CodeCompare: parseCodeCompare,
  FlashCard: parseFlashCard,
}

export default function parseSegments(html) {
  if (!html) return []
  const segments = []
  let last = 0, match

  while ((match = RE.exec(html)) !== null) {
    const before = html.slice(last, match.index)
    if (before.trim()) segments.push({ type: 'html', content: before })

    try {
      const raw = htmlDecode(match[2])
      const code = JSON.parse(raw).code

      let data
      try {
        data = JSON.parse(code)
      } catch {
        const parser = PARSERS[match[1]]
        if (parser) data = parser(code)
      }

      if (data) segments.push({ type: 'component', name: match[1], data })
    } catch {}

    last = RE.lastIndex
  }

  const rest = html.slice(last)
  if (rest.trim()) segments.push({ type: 'html', content: rest })

  return segments
}
