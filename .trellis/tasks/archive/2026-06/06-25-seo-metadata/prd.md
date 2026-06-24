# SEO: OG标签 + sitemap + RSS Feed

## Goal

让博客页面在社交分享时有预览信息，并能被搜索引擎索引。提供 RSS Feed 方便订阅。

## Requirements

- 每篇文章和首页/关于/404 页面有正确的 OG 标签（title、description、url、type）
- SSG 构建时生成 sitemap.xml
- SSG 构建时生成 RSS Feed（feed.xml）
- 客户端 SPA 导航时 document.title 同步更新

## Implementation Approach

- SSG 阶段：在 `static-renderer.js` 中按路由数据生成 meta 标签注入 `<head>`
- 客户端导航：用 `useEffect` 更新 `document.title`
- sitemap + RSS：新增 `scripts/build-seo.js`，构建完成后执行

## Acceptance Criteria

- [x] 分享博客文章到社交平台时显示正确的标题、描述和 URL
- [x] 访问 /sitemap.xml 返回有效的 sitemap（含全部分页的 URL）
- [x] 访问 /feed.xml 返回有效的 Atom Feed（含所有文章条目）
- [x] 客户端路由切换时浏览器标题栏同步更新
