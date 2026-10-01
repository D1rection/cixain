export const CONTENT_COMPILER_VERSION = 'headings-1'
export const ANCHOR_INDEX_VERSION = 1

/** Compare author-facing titles without conflating punctuation or letter case. */
export function normalizeHeadingTitle(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

/** Resolve a wiki hash against the target's source titles and final DOM IDs. */
export function resolveWikiAnchor(ref, index) {
  if (ref.error || !ref.anchor) return { resolvedAnchor: ref.anchor || '' }
  const document = index.get(ref.targetId)
  if (!document) return { unresolved: true }
  if (ref.blockRef) return { resolvedAnchor: ref.anchor }

  const title = normalizeHeadingTitle(ref.anchor)
  let matches = document.headings.filter(heading => normalizeHeadingTitle(heading.title) === title)
  if (!matches.length) {
    matches = document.headings.filter(heading => normalizeHeadingTitle(heading.textTitle) === title)
    if (new Set(matches.map(heading => normalizeHeadingTitle(heading.title))).size > 1) {
      return ambiguous('标题的文字形式对应多个章节')
    }
  }
  if (!matches.length) return { resolvedAnchor: ref.anchor }
  const resolvedAnchor = matches[0].id
  if (document.anchors.includes(ref.anchor) && ref.anchor !== resolvedAnchor) {
    return ambiguous('标题与同名网页 ID 指向不同位置')
  }
  return { resolvedAnchor }
}

function ambiguous(reason) {
  return { resolutionError: { code: 'ambiguous-anchor', reason,
    hint: '使用 #^块ID 明确目标，或使用普通 Markdown URL 指定实际 ID' } }
}

/** Serialize only the visible build's anchor metadata for the history process. */
export function anchorIndexPayload(index) {
  return { schemaVersion: ANCHOR_INDEX_VERSION, documents: Object.fromEntries(index) }
}

/** Reject missing/unsupported or malformed build metadata before history generation. */
export function parseAnchorIndex(value) {
  const invalid = () => { throw new Error('标题索引缺失、格式无效或版本不支持；先运行 build:posts') }
  if (value?.schemaVersion !== ANCHOR_INDEX_VERSION || !value.documents
    || typeof value.documents !== 'object' || Array.isArray(value.documents)) invalid()
  for (const [id, document] of Object.entries(value.documents)) {
    if (!/^(post|fragment|page):[^/]+$/.test(id) || !document
      || !Array.isArray(document.anchors) || !document.anchors.every(x => typeof x === 'string')
      || !Array.isArray(document.blocks) || !document.blocks.every(x => typeof x === 'string')
      || !Array.isArray(document.headings) || !document.headings.every(heading => heading
        && typeof heading.title === 'string' && typeof heading.textTitle === 'string'
        && typeof heading.id === 'string' && document.anchors.includes(heading.id))) invalid()
  }
  return new Map(Object.entries(value.documents))
}
