# 清理分页死路由与分页口径

## Goal

清理 `/page/N` 死路由（App 无此路由，SSG 却生成、sitemap 却收录，内容直出 404），并统一 SSG/SEO 分页基数与首页可见口径（排除 `SITE.homeExcludedCategories`），避免题解类隐藏分类文章增多后产生多余的 `/page/N` 页面与 404 收录。

## Confirmed Facts（来自 Soln 分类任务的独立审查，2026-08-27）

- 真实分页走查询参数：`Pagination.jsx` href 为 `/?page=N`，`Home.jsx` 按 `?page=` 切片（先过滤后切片，永不出现题解）；**不再需要独立 `/page/N` 页面**
- `src/App.jsx` 无 `/page/:n` 路由 → SSG 直出 404 内容（dist/page/N/index.html 实测为 404 组件）
- `scripts/static-renderer.js` L209 附近：以全量 `posts.length` 生成 `/page/N` 路由并 slice（含隐藏分类）
- `scripts/build-seo.js` L34 附近：sitemap 的 `/page/N` 条目以全量 `posts.length` 计算（含隐藏分类），收录 404 页
- 此问题为既有缺陷（非 Soln 分类任务引入），Soln 任务中已评估为 minor，单独立项处理

## Requirements

1. `src/App.jsx` 不新增 `/page/:n` 路由；分页入口保持 `/?page=N` 查询参数（现状）
2. `scripts/static-renderer.js`：移除 `/page/N` 路由生成（含分页 slice 逻辑）；分页计数不再需要
3. `scripts/build-seo.js`：sitemap 不再生成 `/page/N` 条目
4. 确认移除后无其他引用了 `/page/N` 路径的代码（grep 全仓），如 Footer/Sidebar/文档中有链接则一并清理或改指 `/?page=N`
5. 构建管线全绿：`npm run build` 各步不报错；产物无 `dist/page/` 目录残留（旧产物由清理脚本/手动删除）

## Acceptance Criteria

- [ ] `npm run build` 后 `dist/` 无 `page/N/index.html` 产物
- [ ] `sitemap.xml` 无 `/page/N` 条目
- [ ] 首页分页功能不受影响：`/?page=2` 仍正常显示第二页（dev 与静态产物均验证）
- [ ] 全仓无残留 `/page/N`（或 `/page/`）硬编码引用
- [ ] `git diff` 无意外改动

## Out of Scope

- 给 `/page/N` 加路由使其可用（分页已由 `?page=` 承担，此路由无存在必要）
- Soln 分类相关改动（已完成并归档）
- sitemap 其他条目的调整