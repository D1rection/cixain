/**
 * Build a reader-friendly HTML diff from two already compiled article bodies.
 * The compiler runs before this module, so the browser never needs to parse
 * Markdown or ship a diff algorithm.
 */

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])
const BLOCK_TAGS = new Set(['blockquote', 'div', 'details', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'li', 'ol', 'p', 'pre', 'table', 'ul'])
const INLINE_KINDS = new Set(['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
const HEADING_KINDS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

export const REVISION_DIFF_VERSION = '2'

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function decodeEntities(value) {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
}

function tagInfo(source) {
  const match = source.match(/^<\/?([a-z0-9:-]+)/i)
  return match ? match[1].toLowerCase() : null
}

function findTagEnd(html, start) {
  let quote = ''
  for (let i = start + 1; i < html.length; i++) {
    const char = html[i]
    if (quote) {
      if (char === quote) quote = ''
    } else if (char === '"' || char === "'") {
      quote = char
    } else if (char === '>') {
      return i + 1
    }
  }
  return html.length
}

function isBlockStart(raw) {
  const tag = tagInfo(raw)
  if (BLOCK_TAGS.has(tag)) return true
  return tag === 'span' && /\bclass=["'][^"']*\bkatex-display\b/i.test(raw)
}

function isSelfClosing(raw, tag) {
  return /\/\s*>$/.test(raw) || VOID_TAGS.has(tag)
}

function scanTags(html, callback) {
  let cursor = 0
  while (cursor < html.length) {
    const start = html.indexOf('<', cursor)
    if (start < 0) break
    if (html.startsWith('<!--', start)) {
      const end = html.indexOf('-->', start + 4)
      cursor = end < 0 ? html.length : end + 3
      continue
    }
    const end = findTagEnd(html, start)
    const raw = html.slice(start, end)
    if (/^<\/?[a-z]/i.test(raw)) callback(raw, start, end)
    cursor = end
  }
}

function extractMathSource(html) {
  const annotation = html.match(/<annotation\b[^>]*encoding=["']application\/x-tex["'][^>]*>([\s\S]*?)<\/annotation>/i)
  if (annotation) return decodeEntities(annotation[1]).replace(/\s+/g, ' ').trim()
  return 'formula'
}

function comparisonText(html) {
  const withMathPlaceholders = html
    .replace(/<span\b[^>]*\bkatex-display\b[^>]*>[\s\S]*?<\/span>/gi, match => ` ⟦${extractMathSource(match)}⟧ `)
    .replace(/<span\b[^>]*\bkatex\b[^>]*>[\s\S]*?<\/span>/gi, match => ` ⟦${extractMathSource(match)}⟧ `)
    .replace(/<img\b([^>]*)>/gi, (_, attrs) => ` ⟦image:${attrs.match(/\balt=["']([^"']*)/i)?.[1] || ''}⟧ `)
  return decodeEntities(withMathPlaceholders
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
  ).trim()
}

function normalizedHeadingText(value) {
  return value.replace(/^\s*(?:\d+(?:\.\d+)*[.)]?|[一二三四五六七八九十]+、)\s*/u, '').trim()
}

function fingerprint(html) {
  return removeCopyButtons(html)
    .replace(/\s+id=["'][^"']*["']/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Split compiled HTML into top-level article blocks without splitting inline tags. */
export function splitHtmlBlocks(html) {
  const blocks = []
  const stack = []
  let blockStart = null

  scanTags(html, (raw, start, end) => {
    const tag = tagInfo(raw)
    const closing = /^<\//.test(raw)
    if (!tag) return

    if (!closing) {
      if (stack.length === 0 && isBlockStart(raw)) blockStart = start
      if (!isSelfClosing(raw, tag)) stack.push(tag)
      else if (stack.length === 0 && blockStart !== null) {
        const value = html.slice(blockStart, end).trim()
        if (value) blocks.push(makeBlock(value))
        blockStart = null
      }
      return
    }

    const index = stack.lastIndexOf(tag)
    if (index >= 0) stack.splice(index, 1)
    if (stack.length === 0 && blockStart !== null) {
      const value = html.slice(blockStart, end).trim()
      if (value) blocks.push(makeBlock(value))
      blockStart = null
    }
  })

  if (blockStart !== null) {
    const value = html.slice(blockStart).trim()
    if (value) blocks.push(makeBlock(value))
  }
  return blocks
}

function makeBlock(html) {
  const kind = tagInfo(html)
  const text = comparisonText(html)
  return {
    html,
    kind,
    text,
    matchText: HEADING_KINDS.has(kind) ? normalizedHeadingText(text) : text,
    fingerprint: fingerprint(html),
  }
}

function tokenize(value) {
  const tokens = []
  const graphemes = typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter('zh', { granularity: 'grapheme' })
    : null
  let i = 0
  while (i < value.length) {
    const rest = value.slice(i)
    const whitespace = rest.match(/^\s+/u)
    if (whitespace) {
      tokens.push(whitespace[0])
      i += whitespace[0].length
      continue
    }
    const word = rest.match(/^[\p{Letter}\p{Number}_]+/u)
    if (word && !/^[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/u.test(word[0])) {
      tokens.push(word[0])
      i += word[0].length
      continue
    }
    if (graphemes) {
      const segment = graphemes.segment(rest)[Symbol.iterator]().next().value?.segment
      if (segment) {
        tokens.push(segment)
        i += segment.length
        continue
      }
    }
    tokens.push(rest[0])
    i += 1
  }
  return tokens
}

function tokenDiff(before, after) {
  const a = tokenize(before)
  const b = tokenize(after)
  if (a.length * b.length > 40000) {
    return [
      { type: 'removed', value: before },
      { type: 'added', value: after },
    ]
  }

  const table = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }

  const result = []
  const push = (type, value) => {
    if (!value) return
    const last = result[result.length - 1]
    if (last?.type === type) last.value += value
    else result.push({ type, value })
  }
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push('same', a[i])
      i++
      j++
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      push('removed', a[i++])
    } else {
      push('added', b[j++])
    }
  }
  while (i < a.length) push('removed', a[i++])
  while (j < b.length) push('added', b[j++])
  return result
}

function similarity(a, b) {
  const left = tokenize(a)
  const right = tokenize(b)
  if (!left.length && !right.length) return 1
  if (!left.length || !right.length) return 0
  const common = tokenDiff(a, b).filter(part => part.type === 'same').reduce((n, part) => n + tokenize(part.value).length, 0)
  return (2 * common) / (left.length + right.length)
}

function removeCopyButtons(html) {
  return html
    .replace(/<button\b[^>]*\bcopy-btn\b[^>]*>[\s\S]*?<\/button>/gi, '')
    .replace(/\sdata-action="copy"/gi, '')
}

function renderInteractiveAsCode(html) {
  return html.replace(/<div\b([^>]*\bdata-interactive="([^"]+)"[^>]*)><\/div>/gi, (match, attributes, component) => {
    const codeAttribute = attributes.match(/\bdata-code="([^"]*)"/i)?.[1]
    let code = ''
    if (codeAttribute) {
      try {
        code = JSON.parse(decodeEntities(codeAttribute)).code || ''
      } catch {
        code = ''
      }
    }
    const label = '交互组件 ' + component + '（历史版本以代码显示）'
    return '<div class="revision-interactive"><div class="revision-interactive-label">' +
      escapeHtml(label) +
      '</div><pre class="revision-interactive-code"><code>' +
      escapeHtml(code) +
      '</code></pre></div>'
  })
}

function sanitizeComparisonHtml(html) {
  return renderInteractiveAsCode(removeCopyButtons(html))
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/\s+on[a-z-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(?:href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, '')
}

function outerTagAndInner(html) {
  const open = html.match(/^<([a-z0-9:-]+)(\s[^>]*)?>([\s\S]*)<\/\1>$/i)
  if (!open) return null
  return { tag: open[1], attrs: open[2] || '', inner: open[3] }
}

function canInlineDiff(before, after) {
  const left = outerTagAndInner(before.html)
  const right = outerTagAndInner(after.html)
  if (!left || !right || left.tag.toLowerCase() !== right.tag.toLowerCase()) return false
  if (!INLINE_KINDS.has(before.kind)) return false
  const combined = left.inner + right.inner
  return !/<(?:a|img|code|pre|span|strong|em|mark|del|ins|br|svg|table|details)\b/i.test(combined)
}

function renderInlineBlock(kind, before, after) {
  const tag = INLINE_KINDS.has(kind) ? kind : 'p'
  const parts = tokenDiff(before.text, after.text)
  const body = parts.map(part => {
    const text = escapeHtml(part.value)
    if (part.type === 'removed') return `<del class="revision-removed-text">${text}</del>`
    if (part.type === 'added') return `<ins class="revision-added-text">${text}</ins>`
    return text
  }).join('')
  return `<${tag} class="revision-inline-block">${body}</${tag}>`
}

function renderBlock(html, mode) {
  let markedHtml = sanitizeComparisonHtml(html)
  if (mode === 'removed') markedHtml = markedHtml.replace(/\s+id="[^"]*"/gi, '')
  markedHtml = markedHtml
    .replace(
      /<h([1-6])(\s[^>]*)?>/gi,
      (_, level, attrs = '') => '<h' + level + attrs + ' data-revision-state="' + mode + '">',
    )
  return '<div class="revision-block revision-' + mode + '">' + markedHtml + '</div>'
}

function exactKey(block) {
  return block.kind + '|' + block.fingerprint
}

function isUsefulAnchor(block) {
  return HEADING_KINDS.has(block.kind) || block.text.length >= 8
}

function uniqueKeys(blocks) {
  const counts = new Map()
  for (const block of blocks) {
    const key = exactKey(block)
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return counts
}

function anchorPairs(before, after) {
  const beforeCounts = uniqueKeys(before)
  const afterCounts = uniqueKeys(after)
  const allowed = (i, j) => {
    const key = exactKey(before[i])
    return key === exactKey(after[j]) &&
      beforeCounts.get(key) === 1 && afterCounts.get(key) === 1 &&
      isUsefulAnchor(before[i])
  }
  const table = Array.from({ length: before.length + 1 }, () => Array(after.length + 1).fill(0))
  for (let i = before.length - 1; i >= 0; i--) {
    for (let j = after.length - 1; j >= 0; j--) {
      table[i][j] = allowed(i, j)
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }
  const pairs = []
  let i = 0
  let j = 0
  while (i < before.length && j < after.length) {
    if (allowed(i, j)) {
      pairs.push([i, j])
      i++
      j++
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      i++
    } else {
      j++
    }
  }
  return pairs
}

function pairScore(before, after) {
  if (before.kind !== after.kind) return 0
  if (before.fingerprint === after.fingerprint) return 100
  const value = similarity(before.matchText, after.matchText)
  if (HEADING_KINDS.has(before.kind)) return value >= 0.55 ? value * 10 : 0
  return value >= 0.45 ? value * 10 : 0
}

function alignRange(before, after, beforeStart, beforeEnd, afterStart, afterEnd) {
  const left = before.slice(beforeStart, beforeEnd)
  const right = after.slice(afterStart, afterEnd)
  const size = left.length * right.length
  if (size > 250000) {
    return [
      ...left.map(block => ({ type: 'removed', block })),
      ...right.map(block => ({ type: 'added', block })),
    ]
  }

  const table = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0))
  for (let i = left.length - 1; i >= 0; i--) table[i][right.length] = table[i + 1][right.length] - 2
  for (let j = right.length - 1; j >= 0; j--) table[left.length][j] = table[left.length][j + 1] - 2
  for (let i = left.length - 1; i >= 0; i--) {
    for (let j = right.length - 1; j >= 0; j--) {
      const score = pairScore(left[i], right[j])
      const pair = score ? score + table[i + 1][j + 1] : -Infinity
      const remove = table[i + 1][j] - 2
      const add = table[i][j + 1] - 2
      table[i][j] = Math.max(pair, remove, add)
    }
  }

  const operations = []
  let i = 0
  let j = 0
  while (i < left.length || j < right.length) {
    if (i >= left.length) {
      operations.push({ type: 'added', block: right[j++] })
      continue
    }
    if (j >= right.length) {
      operations.push({ type: 'removed', block: left[i++] })
      continue
    }
    const score = pairScore(left[i], right[j])
    const pair = score ? score + table[i + 1][j + 1] : -Infinity
    const remove = table[i + 1][j] - 2
    const add = table[i][j + 1] - 2
    if (score && pair >= remove && pair >= add) {
      if (left[i].fingerprint === right[j].fingerprint) {
        operations.push({ type: 'same', block: right[j] })
      } else {
        operations.push({ type: 'pair', before: left[i], after: right[j] })
      }
      i++
      j++
    } else if (remove >= add) {
      operations.push({ type: 'removed', block: left[i++] })
    } else {
      operations.push({ type: 'added', block: right[j++] })
    }
  }
  return operations
}

function alignBlocks(before, after) {
  const anchors = anchorPairs(before, after)
  const operations = []
  let beforeCursor = 0
  let afterCursor = 0
  for (const [beforeIndex, afterIndex] of anchors) {
    operations.push(...alignRange(before, after, beforeCursor, beforeIndex, afterCursor, afterIndex))
    operations.push({ type: 'same', block: after[afterIndex] })
    beforeCursor = beforeIndex + 1
    afterCursor = afterIndex + 1
  }
  operations.push(...alignRange(before, after, beforeCursor, before.length, afterCursor, after.length))
  return operations
}

function renderChangeGroup(entries, id) {
  const modes = new Set(entries.map(entry => entry.mode))
  const type = modes.size === 1 && modes.has('added')
    ? 'added'
    : modes.size === 1 && modes.has('removed') ? 'removed' : 'modified'
  const label = type === 'added' ? '＋ 新增' : type === 'removed' ? '− 删除' : '↕ 修订'
  const body = entries.map(entry => {
    if (entry.mode === 'inline') return entry.html
    return renderBlock(entry.html, entry.mode)
  }).join('\n')
  return {
    type,
    html: `<div id="revision-change-${id}" class="revision-change revision-change-${type}" data-revision-change="${type}"><div class="revision-change-label"><span aria-hidden="true">${label.slice(0, 1)}</span>${label.slice(2)}</div>${body}</div>`,
  }
}

/**
 * Compare two compiled bodies. Small plain-text edits become inline marks;
 * rich or structured edits keep their original HTML on the old/new side.
 * @returns {{html: string, changes: Array<{id: string, type: string}>, changeCount: number}}
 */
export function createRevisionDiff(beforeHtml, afterHtml) {
  const before = splitHtmlBlocks(beforeHtml)
  const after = splitHtmlBlocks(afterHtml)
  const operations = alignBlocks(before, after)
  const rendered = []
  const changes = []
  let pending = []

  const flush = () => {
    if (!pending.length) return
    const id = changes.length + 1
    const group = renderChangeGroup(pending, id)
    rendered.push(group.html)
    changes.push({ id: `revision-change-${id}`, type: group.type })
    pending = []
  }

  for (const operation of operations) {
    if (operation.type === 'same') {
      flush()
      rendered.push(sanitizeComparisonHtml(operation.block.html))
      continue
    }
    if (operation.type === 'removed') {
      pending.push({ mode: 'removed', html: operation.block.html })
      continue
    }
    if (operation.type === 'added') {
      pending.push({ mode: 'added', html: operation.block.html })
      continue
    }

    if (canInlineDiff(operation.before, operation.after)) {
      pending.push({ mode: 'inline', html: renderInlineBlock(operation.after.kind, operation.before, operation.after) })
    } else {
      pending.push({ mode: 'removed', html: operation.before.html })
      pending.push({ mode: 'added', html: operation.after.html })
    }
  }
  flush()

  return { html: rendered.join('\n'), changes, changeCount: changes.length }
}
