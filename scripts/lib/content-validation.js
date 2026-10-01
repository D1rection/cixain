/** Return stable, deduplicated diagnostics for published-source references and block IDs. */
export function validateContentReferences(refs, registry, allContent, anchors, blocks) {
  const diagnostics = []
  const seen = new Set()
  const add = (ref, code, reason, hint) => {
    const key = JSON.stringify([ref.fromId, ref.targetId || ref.raw, ref.syntax, ref.resolvedAnchor ?? ref.anchor ?? ref.id ?? '', code])
    if (seen.has(key)) return
    seen.add(key)
    diagnostics.push({ code, sourceFile: allContent.get(ref.fromId)?.file || ref.fromId,
      sourcePosition: ref.position || null, raw: ref.raw, targetId: ref.targetId, reason, hint })
  }
  for (const ref of refs) {
    if (ref.error) { add(ref, ref.error, ref.reason, '检查链接前缀、文件名和百分号转义'); continue }
    if (!registry.has(ref.targetId)) {
      const target = allContent.get(ref.targetId)
      add(ref, target ? 'unpublished-target' : 'missing-target', target ? `目标未发布（${target.state}）` : '目标内容不存在',
        '检查文件名；引用碎片需 fragment/ 前缀，草稿须先发布')
    } else if (ref.resolutionError) {
      const { code, reason, hint } = ref.resolutionError
      add(ref, code, reason, hint)
    } else if (ref.blockRef && !(blocks.get(ref.targetId) || []).includes(ref.anchor)) {
      add(ref, 'missing-block', '目标块 ID 不存在', '检查目标段落末尾的 ^id')
    } else if (ref.anchor && !(anchors.get(ref.targetId) || []).includes(ref.resolvedAnchor ?? ref.anchor)) {
      add(ref, 'missing-anchor', '目标锚点不存在', ref.syntax === 'wiki'
        ? '检查目标原始标题或 #^块ID' : '使用目标页面实际生成的 ID')
    }
  }
  for (const [id, definitions] of blocks) {
    const unique = new Set()
    for (const anchor of definitions) {
      if (unique.has(anchor)) add({ fromId: id, targetId: id, anchor, raw: `^${anchor}` }, 'duplicate-block', '同页块 ID 重复', '每个块使用唯一 ID')
      unique.add(anchor)
    }
  }
  return diagnostics
}

/** Gate production before writing files; development remains previewable with explicit warnings. */
export function reportContentDiagnostics(diagnostics, dev) {
  for (const item of diagnostics) {
    const position = item.sourcePosition ? `:${item.sourcePosition.line}:${item.sourcePosition.column}` : ''
    console.warn(`[${item.code}] ${item.sourceFile}${position}: ${item.raw} — ${item.reason}；${item.hint}`)
  }
  if (diagnostics.length && !dev) throw new Error(`内容校验失败：${diagnostics.length} 条问题，未写入生成文件`)
}
