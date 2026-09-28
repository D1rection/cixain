function normalizeWithMap(value) {
  let normalized = ''
  const starts = []
  const ends = []
  let sourceOffset = 0
  for (const char of String(value || '')) {
    const folded = char.normalize('NFKC').toLocaleLowerCase()
    normalized += folded
    for (let i = 0; i < folded.length; i++) {
      starts.push(sourceOffset)
      ends.push(sourceOffset + char.length)
    }
    sourceOffset += char.length
  }
  return { normalized, starts, ends }
}

export function normalizeSearchText(value) {
  return normalizeWithMap(value).normalized
}

export function searchTokens(query) {
  return [...new Set(normalizeSearchText(query).trim().split(/\s+/).filter(Boolean))]
}

function findRanges(value, tokens) {
  const { normalized, starts, ends } = normalizeWithMap(value)
  const ranges = []
  for (const token of tokens) {
    let offset = 0
    while (token && offset < normalized.length) {
      const found = normalized.indexOf(token, offset)
      if (found < 0) break
      const last = found + token.length - 1
      if (starts[found] !== undefined && ends[last] !== undefined) {
        ranges.push([starts[found], ends[last]])
      }
      offset = found + Math.max(1, token.length)
    }
  }
  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  return ranges.reduce((merged, range) => {
    const previous = merged[merged.length - 1]
    if (previous && range[0] <= previous[1]) previous[1] = Math.max(previous[1], range[1])
    else merged.push([...range])
    return merged
  }, [])
}

function snippetFor(text, tokens, limit = 180) {
  const value = String(text || '').replace(/\s+/g, ' ').trim()
  const ranges = findRanges(value, tokens)
  if (value.length <= limit) return { text: value, ranges }
  const matchStart = ranges[0]?.[0] ?? 0
  const start = Math.max(0, Math.min(matchStart - 60, value.length - limit))
  const end = Math.min(value.length, start + limit)
  const snippet = value.slice(start, end)
  return {
    text: `${start ? '…' : ''}${snippet}${end < value.length ? '…' : ''}`,
    ranges: ranges.filter(([a, b]) => b > start && a < end).map(([a, b]) => [Math.max(0, a - start) + (start ? 1 : 0), Math.min(end, b) - start + (start ? 1 : 0)]),
  }
}

function includesEvery(text, tokens) {
  const normalized = normalizeSearchText(text)
  return tokens.every(token => normalized.includes(token))
}

function candidateRank(item, query, tokens) {
  const title = normalizeSearchText(item.title)
  const full = normalizeSearchText(query)
  if (title === full) return 0
  if (full && title.includes(full)) return 1
  if (includesEvery(`${item.title || ''} ${item.slug || ''}`, tokens)) return 2
  if (includesEvery((item.tags || []).join(' '), tokens)) return 3
  if (includesEvery(item.description, tokens)) return 4
  const body = (item.sections || []).map(section => `${section.heading || ''} ${section.text || ''}`).join(' ')
  return includesEvery(body, tokens) ? 5 : Infinity
}

function bestSection(item, tokens) {
  const sections = item.sections || []
  let best = null
  let score = 0
  for (const section of sections) {
    const text = `${section.heading || ''} ${section.text || ''}`
    const normalized = normalizeSearchText(text)
    const hits = tokens.filter(token => normalized.includes(token)).length
    if (hits > score) {
      best = section
      score = hits
    }
  }
  return best
}

export function searchDocuments(documents, query, fuzzyIndex) {
  const tokens = searchTokens(query)
  if (!tokens.length) return []
  const results = []
  const exactIds = new Set()

  for (const item of documents) {
    const rank = candidateRank(item, query, tokens)
    if (!Number.isFinite(rank)) continue
    const section = bestSection(item, tokens)
    const context = section?.text || section?.heading || item.description || ''
    const snippet = snippetFor(context, tokens)
    const matchedTags = (item.tags || []).filter(tag => tokens.some(token => normalizeSearchText(tag).includes(token)))
    const url = item.url || (item.kind === 'fragment' ? `/fragment/${encodeURIComponent(item.slug)}/` : `/blog/${encodeURIComponent(item.slug)}/`)
    results.push({ item, url: `${url}${section?.anchor ? `#${encodeURIComponent(section.anchor)}` : ''}`, snippet, matchedTags, titleRanges: findRanges(item.title, tokens), rank, score: 0 })
    exactIds.add(item.id || `${item.kind}:${item.slug}`)
  }

  if (tokens.join('').length >= 3 && !/[\u3400-\u9fff]/u.test(query) && fuzzyIndex) {
    for (const match of fuzzyIndex.search(query)) {
      const item = match.item
      const id = item.id || `${item.kind}:${item.slug}`
      if (exactIds.has(id)) continue
      const section = bestSection(item, tokens)
      const snippet = snippetFor(section?.text || item.description || '', tokens)
      const matchedTags = (item.tags || []).filter(tag => tokens.some(token => normalizeSearchText(tag).includes(token)))
      const url = item.url || (item.kind === 'fragment' ? `/fragment/${encodeURIComponent(item.slug)}/` : `/blog/${encodeURIComponent(item.slug)}/`)
      results.push({ item, url: `${url}${section?.anchor ? `#${encodeURIComponent(section.anchor)}` : ''}`, snippet, matchedTags, titleRanges: findRanges(item.title, tokens), rank: 6, score: match.score ?? 1 })
    }
  }

  return results.sort((a, b) => a.rank - b.rank || a.score - b.score || String(b.item.date || '').localeCompare(String(a.item.date || '')) || String(a.item.id).localeCompare(String(b.item.id)))
}

export function highlightRanges(value, ranges) {
  const output = []
  let cursor = 0
  for (const [start, end] of ranges || []) {
    if (start > cursor) output.push({ text: value.slice(cursor, start), hit: false })
    if (end > cursor) output.push({ text: value.slice(Math.max(cursor, start), end), hit: true })
    cursor = Math.max(cursor, end)
  }
  if (cursor < value.length) output.push({ text: value.slice(cursor), hit: false })
  return output
}
