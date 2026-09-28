/** Generate the same stable-per-title anchor used by the client TOC. */
export function slugifyHeading(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w一-鿿-]+/g, '')
    .replace(/^-+|-+$/g, '')
    || 'heading'
}
