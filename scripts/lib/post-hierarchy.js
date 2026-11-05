/**
 * Validate the visible post graph before compilation. Sources include unpublished
 * targets so a missing parent is distinguishable from an unpublished ancestor.
 * @param {Map<string, Object>} sources
 * @returns {{parentIds: Map<string, string|null>, invalidIds: Set<string>, diagnostics: Object[]}}
 */
export function validatePostHierarchy(sources) {
  const parentIds = new Map()
  const validity = new Map()
  const diagnostics = []
  const add = (id, code, reason, targetId = null) => {
    const source = sources.get(id)
    diagnostics.push({ code, sourceFile: source.file, field: 'parent',
      raw: `parent: ${JSON.stringify(source.parent)}`, targetId, reason,
      hint: 'parent 只能指向已发布的 post:文件名；检查父链并修正绑定' })
    validity.set(id, false)
  }

  for (const [id, source] of sources) {
    if (source.state !== 'visible') continue
    if (id.startsWith('fragment:')) {
      if (source.hasParent) add(id, 'unsupported-fragment-parent', '碎片不支持 parent 字段')
      continue
    }
    if (!id.startsWith('post:')) continue
    const raw = source.parent
    if (raw == null || (typeof raw === 'string' && !raw.trim())) {
      parentIds.set(id, null)
      continue
    }
    if (typeof raw !== 'string' || !/^post:[^/\\#?\u0000-\u001f]+$/.test(raw.trim())) {
      add(id, 'invalid-post-parent', 'parent 必须是 post:文件名 格式的单个文章 ID')
      continue
    }
    const parentId = raw.trim()
    parentIds.set(id, parentId)
    if (parentId === id) add(id, 'self-post-parent', '文章不能是自己的父文章', parentId)
    else if (!sources.has(parentId)) add(id, 'missing-post-parent', '父文章不存在', parentId)
    else if (sources.get(parentId).state !== 'visible') {
      add(id, 'unpublished-post-parent', `父文章未发布（${sources.get(parentId).state}）`, parentId)
    }
  }

  // Each node is settled once. Iterative traversal also supports very deep trees.
  for (const id of parentIds.keys()) {
    if (validity.has(id)) continue
    const path = []
    const positions = new Map()
    let cursor = id
    while (cursor && !validity.has(cursor) && !positions.has(cursor)) {
      positions.set(cursor, path.length)
      path.push(cursor)
      cursor = parentIds.get(cursor)
    }
    if (cursor && positions.has(cursor)) {
      const cycle = path.slice(positions.get(cursor))
      const reason = `父子关系存在循环：${[...cycle, cursor].join(' → ')}`
      for (const node of cycle) add(node, 'cyclic-post-parent', reason, parentIds.get(node))
    }
    let valid = !cursor || validity.get(cursor) === true
    for (let i = path.length - 1; i >= 0; i--) {
      const node = path[i]
      if (validity.get(node) === false) valid = false
      else if (!valid) add(node, 'unpublished-post-parent', `祖先关系无效：${parentIds.get(node)}`, parentIds.get(node))
      else validity.set(node, true)
    }
  }
  return { parentIds, invalidIds: new Set([...validity].filter(([, valid]) => !valid).map(([id]) => id)), diagnostics }
}
