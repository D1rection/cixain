# 修复系列页静态路由 404

## Goal

让每个已发布文章系列都拥有可直接访问、可刷新、可被搜索引擎发现的静态页面，消除当前仅在 SPA 站内跳转时可用、直接访问返回 404 的问题。

## Requirements

- 从已发布文章元数据动态发现系列，不维护额外的硬编码系列列表。
- 静态构建必须为每个唯一系列生成 `/series/<encoded-name>/index.html`。
- 系列页的数据和排序行为必须与现有前端 `FilteredList` / `sortSeries` 保持一致。
- 系列页必须拥有正确的页面标题、描述和 canonical URL。
- Sitemap 必须收录所有系列页，且 URL 路径与静态产物一致。
- 保持现有首页、文章、分类、标签、归档和关于页行为不变。

## Acceptance Criteria

- [x] 完整生产构建成功。
- [x] 构建产物包含当前三个系列（算法、CS229 机器学习、图形学）的 `index.html`。
- [x] 直接打开任一系列 URL 返回系列列表，而不是 404。
- [x] 系列页 SSR HTML 包含系列标题和对应文章。
- [x] `sitemap.xml` 包含三个系列 URL。
- [x] 不新增手写系列清单，新增系列能随文章 frontmatter 自动进入 SSG 与 Sitemap。

## Notes

- 本任务是轻量、单一交付物修复，采用 PRD-only；实现范围限定为系列静态路由与其 SEO 产物。
- 线上已验证：站内点击 `/series/CS229%20机器学习` 可用，但带尾斜杠直接请求返回 HTTP 404。
