/** Validate a real calendar day without locale or Date's overflow normalization. */
export function fragmentDate(value, file, field) {
  const text = value instanceof Date && Number.isFinite(value.getTime())
    && value.toISOString().endsWith('T00:00:00.000Z') ? value.toISOString().slice(0, 10) : value
  if (typeof text !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(`${file}: ${field} 必须是 YYYY-MM-DD 日期`)
  }
  const date = new Date(`${text}T00:00:00.000Z`)
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== text) {
    throw new Error(`${file}: ${field} 不是有效日历日期: ${text}`)
  }
  return text
}

/** Keep blank drafts editable; validate published fragment fields before generating any output. */
export function fragmentFrontmatter(data, { file, dev = false, matter = '', now = new Date() }) {
  if (data.draft !== undefined && typeof data.draft !== 'boolean') {
    throw new Error(`${file}: draft 必须是布尔值 true 或 false`)
  }
  // Check scalar source too: YAML can normalize an impossible unquoted date into a valid Date.
  for (const field of ['date', 'updated']) {
    const raw = matter.match(new RegExp(`^${field}:[ \t]*([^\\r\\n]*)`, 'm'))?.[1].replace(/\s+#.*$/, '').trim()
    if (raw && /^\d{4}-/.test(raw)) fragmentDate(raw, file, field)
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') fragmentDate(data[field], file, field)
  }
  const date = data.date ? fragmentDate(data.date, file, 'date') : null
  const updated = data.updated ? fragmentDate(data.updated, file, 'updated') : null
  if (date && updated && updated < date) throw new Error(`${file}: updated 不能早于 date`)
  const normalized = { ...data, date, updated, draft: data.draft ?? false }
  if (normalized.draft && !dev) return { data: normalized, state: 'draft' }
  if (typeof data.title !== 'string' || !data.title.trim() || !date) {
    if (normalized.draft) return { data: normalized, state: 'incomplete-draft' }
    throw new Error(`${file}: 发布碎片必须填写 title 和 date`)
  }
  const today = new Date(now.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10)
  return { data: normalized, state: date > today ? 'future' : 'visible' }
}
