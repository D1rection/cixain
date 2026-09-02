/**
 * 将页面路由规范化为静态主机使用的目录 URL。
 * 根路径保持 `/`，查询串和 hash 保持原样。
 * @param {string} path
 * @returns {string}
 */
export function routePath(path = '/') {
  const match = String(path).match(/^([^?#]*)([?#].*)?$/)
  const pathname = match?.[1] || '/'
  const suffix = match?.[2] || ''
  if (pathname === '/') return `/${suffix}`
  return `${pathname.replace(/\/+$/, '')}/${suffix}`
}

/**
 * 比较两个页面路径时忽略尾斜杠差异。
 * @param {string} left
 * @param {string} right
 * @returns {boolean}
 */
export function sameRoute(left, right) {
  return routePath(left) === routePath(right)
}
