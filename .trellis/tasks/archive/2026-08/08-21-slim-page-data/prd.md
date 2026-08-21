# PRD: 每页内联全站文章 HTML 瘦身

## 背景

构建产物中，每个路由页（首页、文章页、分类、标签、分页）都把**全部文章（当前 12 篇）的完整正文 HTML** 内联进 `<script id="__BLOG_DATA__">`：

- `dist/index.html` 实测 2034KB，其中 `__BLOG_DATA__` 占 2024KB（99.4%），gzip 后约 141KB
- 文章页 2.4MB 级（该文自身正文 + 全站正文）

首屏需下载并 `JSON.parse` 2MB 数据，这是首次加载慢的主因（调研结论：主流博客系统均按「页面粒度数据 + 按需分发 + 预取」处理，无站点级全量内联）。

## 目标

只解决「每页内联全站文章 HTML」一个问题。让每页 HTML 只携带**当前页渲染所需**的数据，其余文章正文改为 SPA 导航时按需 fetch。其他优化（bundle 分割、背景图、feed.xml 瘦身）不在本次范围。

## 需求

1. **列表类页面**（`/`、`/page/N`、`/category/*`、`/tag/*`、`/archive`、`/about`）：`__BLOG_DATA__` 只含文章**元数据列表**（slug/title/date/updated/description/category/tags/series/seriesIndex/draft/cover），不含任何 `postContent`。
2. **文章页**（`/blog/:slug`）：只内联**当前文章**的正文（SSR 直出 + 水合需要），列表里其余文章仅元数据。
3. **按需加载**：客户端从元数据上下文跳转到某篇文章时，用现有 fetch 回退拉取该文正文（`/content/posts/{slug}.html`），正文文件需随构建发布到 `dist/`。
4. **行为不变**：SSR 首屏直出、SEO（meta/OG/JSON-LD）、RSS、sitemap、search-index、dev 模式（纯 SPA）、404 页均保持现状。
5. **体验**：页面间导航仍为 SPA 无整页刷新；允许跳转时一次同源小请求（gzip 后约 30–40KB）。

## 验收标准

可测量项：

- 重建后 `dist/index.html` 未压缩 < 100KB，且不含 `postContent` 字段
- `dist/blog/*/index.html` 仅当前文章的 `postContent`，其余文章无该字段
- `dist/content/posts/*.html` 存在且与 `content/posts/` 一致（按需拉取可用）
- 首页 HTML gzip 体积较现状（141KB）下降 ≥ 80%

可行为项（浏览器实测，`npm run build && npm run preview`）：

- 首页冷加载无 React 水合 mismatch 警告（console 无 hydration 报错）
- 首页 → 文章、文章 → 另一文章、文章 → 首页、系列切换，内容渲染正确
- 打开搜索（search-index.json 按需）、RSS / sitemap 存在
- `npm run dev` 模式行为与改动前一致