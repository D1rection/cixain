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
  /**
   * 首页列表排除的分类：题解文章只从 /category/<slug> 分类页进入，
   * 不进首页（含分页）；归档/标签/搜索/相关推荐不受影响。
   */
  homeExcludedCategories: ['Soln'],
  social: {
    github: 'https://github.com/D1rection',
  },
}
