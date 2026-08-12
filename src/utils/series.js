/**
 * 系列工具：同系列文章排序（seriesIndex 优先，缺省日期）
 * @param {Object[]} posts 全部文章
 * @param {string} name 系列名
 * @returns {Object[]} 排序后的同系列文章
 */
export function sortSeries(posts, name) {
  return posts
    .filter(p => p.series === name)
    .sort((a, b) => {
      const ai = a.seriesIndex ?? Infinity
      const bi = b.seriesIndex ?? Infinity
      if (ai !== bi) return ai - bi
      return new Date(a.date) - new Date(b.date)
    })
}

