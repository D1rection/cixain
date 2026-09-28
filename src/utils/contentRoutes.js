import { routePath } from './routes.js'

/**
 * Return the canonical route for a content record.
 * @param {'post'|'fragment'} kind
 * @param {string} slug
 */
export function contentUrl(kind, slug) {
  const segment = encodeURIComponent(String(slug))
  return routePath(kind === 'fragment' ? `/fragment/${segment}` : `/blog/${segment}`)
}

/** Decode one route parameter without allowing malformed escapes to throw. */
export function decodeRouteSegment(segment = '') {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}
