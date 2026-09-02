/**
 * 从文章元数据读取日历日期，不把 UTC 零点转换成本地日期。
 * @param {string|Date|number} value
 * @returns {{ year: number, month: number, day: number }|null}
 */
export function getDateParts(value) {
  const text = typeof value === 'string' ? value : ''
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() }
}

/**
 * 格式化文章日期，使用固定的斜杠格式，避免 locale 和时区影响 SSR 水合。
 * @param {string|Date|number} value
 * @param {{ pad?: boolean }} [options]
 * @returns {string}
 */
export function formatDate(value, { pad = false } = {}) {
  const parts = getDateParts(value)
  if (!parts) return ''
  const month = pad ? String(parts.month).padStart(2, '0') : String(parts.month)
  const day = pad ? String(parts.day).padStart(2, '0') : String(parts.day)
  return `${parts.year}/${month}/${day}`
}

/**
 * 用于比较两个文章日期的日历日期部分。
 * @param {string|Date|number} value
 * @returns {string}
 */
export function dateKey(value) {
  const parts = getDateParts(value)
  if (!parts) return ''
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}
