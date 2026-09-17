/** 每页文章数 */
export const PAGE_SIZE = 10

/** 背景图片数量（public/bg-0.png ~ bg-N.png） */
export const BG_COUNT = 3

/** 站点配置 */
export const SITE = {
  title: 'cixain',
  /** 导航分类：[显示名, 前端 category 字段值]（侧边栏只列具体分类，无「全部」项） */
  categories: [
    ['技术', 'Tech'],
    ['随笔', 'Life'],
    ['题解', 'Soln'],
  ],
  /** RSS 排除的分类：首页可见性由文章的 showOnHome 属性单独控制。 */
  rssExcludedCategories: ['Soln'],
  social: {
    github: 'https://github.com/D1rection',
  },
}
