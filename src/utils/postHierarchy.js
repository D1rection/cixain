/** Whether a post participates in the site's top-level article lists.
 * @param {Object} post
 * @returns {boolean}
 */
export function isRootPost(post) {
  return (!post.kind || post.kind === 'post') && !post.parentId
}

/** Select roots without removing children from the shared metadata collection.
 * @param {Object[]} posts
 * @returns {Object[]}
 */
export function rootPosts(posts = []) {
  return posts.filter(isRootPost)
}

/** Select only direct children, in stable reading order.
 * @param {Object[]} posts
 * @param {string} parentId
 * @returns {Object[]}
 */
export function directChildPosts(posts = [], parentId) {
  if (!parentId) return []
  return posts.filter(post => post.kind === 'post' && post.parentId === parentId)
    .sort((a, b) => new Date(a.date) - new Date(b.date) || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))
}

/** Resolve a parent by namespaced ID, never by title or fragment filename.
 * @param {Object[]} posts
 * @param {Object} post
 * @returns {Object|undefined}
 */
export function parentPost(posts = [], post) {
  return post?.parentId ? posts.find(item => item.kind === 'post' && item.id === post.parentId) : undefined
}
