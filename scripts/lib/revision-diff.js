/**
 * Build a reader-friendly HTML diff from two already compiled article bodies.
 * The compiler runs before this module, so the browser never needs to parse
 * Markdown or ship a diff algorithm.
 */

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])
const BLOCK_TAGS = new Set(['blockquote', 'div', 'details', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'li', 'ol', 'p', 'pre', 'table', 'ul'])
const INLINE_KINDS = new Set(['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

export const REVISION_DIFF_VERSION = '1'

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

function plainText(html) {
  return decodeEntities(html
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
  ).trim()
}

function tagInfo(source) {
  const match = source.match(/^<\/?([a-z0-9:-]+)/i)
  return match ? match[1].toLowerCase() : null
}

/** Split compiled HTML into top-level article blocks without parsing nested inline tags. */
export function splitHtmlBlocks(html) {
  const blocks = []
  const tagRe = /<!--[\s\S]*?-->|<\/?[a-z][^>]*>/gi
  const stack = []
  let blockStart = null
  let match

  while ((match = tagRe.exec(html))) {
    const raw = match[0]
    if (raw.startsWith('<!--')) continue
    const tag = tagInfo(raw)
    if (!BLOCK_TAGS.has(tag)) continue
    const closing = /^<\//.test(raw)
    const selfClosing = /\/\s*>$/.test(raw) || VOID_TAGS.has(tag)

    if (!closing) {
      if (stack.length === 0) blockStart = match.index
      if (!selfClosing) stack.push(tag)
      else if (stack.length === 0 && blockStart !== null) {
        const value = html.slice(blockStart, tagRe.lastIndex).trim()
        if (value) blocks.push({ html: value, kind: tagInfo(value), text: plainText(value) })
        blockStart = null
      }
    } else {
      const index = stack.lastIndexOf(tag)
      if (index >= 0) stack.splice(index, 1)
      if (stack.length === 0 && blockStart !== null) {
        const value = html.slice(blockStart, tagRe.lastIndex).trim()
        if (value) blocks.push({ html: value, kind: tagInfo(value), text: plainText(value) })
        blockStart = null
      }
    }
  }

  if (blockStart !== null) {
    const value = html.slice(blockStart).trim()
    if (value) blocks.push({ html: value, kind: tagInfo(value), text: plainText(value) })
  }
  return blocks
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
    if (word) {
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

function renderInlineBlock(kind, before, after) {
  const tag = INLINE_KINDS.has(kind) ? kind : 'p'
  const parts = tokenDiff(before, after)
  const body = parts.map(part => {
    const text = escapeHtml(part.value)
    if (part.type === 'removed') return `<del class="revision-removed-text">${text}</del>`
    if (part.type === 'added') return `<ins class="revision-added-text">${text}</ins>`
    return text
  }).join('')
  return `<${tag} class="revision-inline-block">${body}</${tag}>`
}

function renderBlock(kind, html, mode) {
  const label = mode === 'removed' ? '删除的内容' : '新增的内容'
  const markedHtml = sanitizeComparisonHtml(html).replace(
    /<h([1-6])(\s[^>]*)?>/gi,
    (_, level, attrs = '') => '<h' + level + attrs + ' data-revision-state="' + mode + '">',
  )
  return '<div class="revision-block revision-' + mode + '"><div class="revision-label">' +
    label +
    '</div>' +
    markedHtml +
    '</div>'
}

function sameBlock(a, b) {
  return a.kind === b.kind && a.text === b.text
}

function findAhead(blocks, start, target, limit = 4) {
  for (let i = start + 1; i < Math.min(blocks.length, start + limit + 1); i++) {
    if (sameBlock(blocks[i], target)) return i
  }
  return -1
}

/**
 * Compare two compiled bodies. Small prose edits become inline marks; larger
 * or structured edits become explicit added/removed blocks.
 */
export function createRevisionDiff(beforeHtml, afterHtml) {
  const before = splitHtmlBlocks(beforeHtml)
  const after = splitHtmlBlocks(afterHtml)
  const output = []
  let i = 0
  let j = 0
  let changeCount = 0

  while (i < before.length || j < after.length) {
    if (i >= before.length) {
      output.push(renderBlock(after[j].kind, after[j].html, 'added'))
      changeCount++
      j++
      continue
    }
    if (j >= after.length) {
      output.push(renderBlock(before[i].kind, before[i].html, 'removed'))
      changeCount++
      i++
      continue
    }
    if (sameBlock(before[i], after[j])) {
      output.push(sanitizeComparisonHtml(after[j].html))
      i++
      j++
      continue
    }

    const oldAhead = findAhead(before, i, after[j])
    const newAhead = findAhead(after, j, before[i])
    if (oldAhead >= 0 && (newAhead < 0 || oldAhead - i <= newAhead - j)) {
      for (; i < oldAhead; i++) {
        output.push(renderBlock(before[i].kind, before[i].html, 'removed'))
        changeCount++
      }
      continue
    }
    if (newAhead >= 0) {
      for (; j < newAhead; j++) {
        output.push(renderBlock(after[j].kind, after[j].html, 'added'))
        changeCount++
      }
      continue
    }

    if (before[i].kind === after[j].kind && INLINE_KINDS.has(after[j].kind) && similarity(before[i].text, after[j].text) >= 0.2) {
      output.push(renderInlineBlock(after[j].kind, before[i].text, after[j].text))
      changeCount++
      i++
      j++
      continue
    }

    output.push(renderBlock(before[i].kind, before[i].html, 'removed'))
    output.push(renderBlock(after[j].kind, after[j].html, 'added'))
    changeCount += 1
    i++
    j++
  }

  return { html: output.join('\n'), changeCount }
}
