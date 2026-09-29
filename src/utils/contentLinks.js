/** Resolve wiki targets independently of visibility and rendering. Bare names always mean posts. */
export function parseWikiTarget(value, current = { kind: 'post', slug: '' }) {
  const raw = String(value || '').trim()
  let kind = 'post'
  let slug = raw
  let anchor = ''
  let sameDocument = false
  if (raw.startsWith('#') || raw.startsWith('^')) {
    kind = current.kind
    slug = current.slug
    anchor = raw.startsWith('#') ? raw.slice(1) : raw
    sameDocument = true
  } else {
    const hash = raw.indexOf('#')
    if (hash >= 0) { slug = raw.slice(0, hash); anchor = raw.slice(hash + 1) }
    if (slug.startsWith('fragment/')) { kind = 'fragment'; slug = slug.slice(9) }
    else if (slug.startsWith('posts/')) slug = slug.slice(6)
    else if (slug.startsWith('post/')) slug = slug.slice(5)
  }
  try {
    if (!sameDocument) slug = decodeURIComponent(slug)
    anchor = decodeURIComponent(anchor)
  } catch {
    return { error: 'invalid-target', reason: '链接包含非法百分号转义', raw }
  }
  const blockRef = anchor.startsWith('^')
  if (blockRef) anchor = anchor.slice(1)
  if (!slug || /[\\/\u0000-\u001f]/.test(slug) || slug === '.' || slug === '..' || (blockRef && !anchor)) {
    return { error: 'invalid-target', reason: '链接目标文件名或块 ID 无效', raw }
  }
  return { kind, slug, anchor, blockRef, sameDocument, targetId: `${kind}:${slug}` }
}

/** Shared visible label for search text and rendered links; never borrow another kind's title. */
export function wikiLinkLabel(wikiLink, current, registry = new Map()) {
  const target = parseWikiTarget(wikiLink.value, current)
  return wikiLink.alias || registry.get(target.targetId)?.title || target.slug || wikiLink.value
}
