// OG 图文本工具：SVG 无自动换行，按字符宽度估算断行
function charWidth(ch) {
  const code = ch.codePointAt(0)
  return code >= 0x2e80 && code <= 0x9fff ? 1 : 0.5
}

export function wrapTitle(title, maxUnits) {
  const chars = [...title]
  const lines = []
  let cur = ''
  let units = 0
  for (const ch of chars) {
    const w = charWidth(ch)
    if (cur && units + w > maxUnits) {
      if (lines.length === 1) break // 只保留两行，剩余丢弃
      lines.push(cur)
      cur = ch
      units = w
    } else {
      cur += ch
      units += w
    }
  }
  if (lines.length === 1 && cur) {
    // 第二行超长 → 截断加省略号；未超长原样保留
    const limit = maxUnits - 1 // 留一个省略号宽度
    let cut = ''
    let cutUnits = 0
    let truncated = false
    for (const ch of [...cur]) {
      if (cut && cutUnits + charWidth(ch) > limit) {
        truncated = true
        break
      }
      cut += ch
      cutUnits += charWidth(ch)
    }
    lines.push(truncated ? cut + '…' : cut)
  } else {
    lines.push(cur || '…')
  }
  return lines
}
