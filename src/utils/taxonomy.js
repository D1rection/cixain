import { SITE } from '../config.js'

function compareNames(a, b) {
  return a < b ? -1 : a > b ? 1 : 0
}

/**
 * Build the shared category, series, and tag index used by desktop and mobile.
 * @param {Object[]} posts
 * @returns {{ categories: Object[], series: Object[], tags: Object[], tagMax: number }}
 */
export function buildTaxonomy(posts = []) {
  const categoryCounts = new Map(SITE.categories.map(([label, slug]) => [slug, { label, slug, count: 0 }]))
  const tagCounts = new Map()
  const seriesPosts = new Map()

  posts.forEach(post => {
    const category = categoryCounts.get(post.category)
    if (category) category.count += 1

    ;(post.tags || []).forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1))

    if (post.series) {
      if (!seriesPosts.has(post.series)) seriesPosts.set(post.series, [])
      seriesPosts.get(post.series).push(post)
    }
  })

  const tags = [...tagCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || compareNames(a.name, b.name))
  const tagMax = tags.length ? tags[0].count : 0

  const series = [...seriesPosts.entries()]
    .map(([name, list]) => ({
      name,
      count: list.length,
      latest: Math.max(...list.map(post => +new Date(post.date))),
    }))
    .sort((a, b) => b.latest - a.latest || compareNames(a.name, b.name))

  return {
    categories: [...categoryCounts.values()],
    series,
    tags,
    tagMax,
  }
}
