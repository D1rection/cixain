# Fragment 返回首页调查（2026-10-05）

## 复现证据

对已有 `dist` 启动 Vite preview，浏览器直接打开 `http://127.0.0.1:4173/fragment/mnist-format/`，碎片正常。点击导航首页后 URL 变为 `/`，页面显示“暂无文章”，技术、随笔、题解计数全部为 0；刷新首页后恢复文章列表。截图为同目录 `fragment-home-empty.jpg`。

产物解析：`dist/index.html` 数据键为 `posts/fragments`，有 26 篇文章、1 个碎片；碎片详情数据键为 `fragment/fragments`，`posts` 缺失。本轮未重新构建或修改应用代码，临时预览已停止。线上浏览器访问超时，未获得线上复现证据。

## 代码因果链

- `scripts/static-renderer.js` 的碎片 route data 漏了文章元数据，相邻文章详情却携带全量文章集合。
- `src/main.jsx` 的 SSG 分支将首次 JSON 固定交给上下文；dev 分支导入全量集合。
- `src/components/NavBar.jsx` 首页及品牌使用 wouter Link，返回首页沿用上下文。
- `Home`、`Sidebar` 缺少 posts 时回退空数组，呈现空列表及零分类计数；归档、索引与筛选页也依赖该集合。

结论：生产碎片漏注入元数据，与固定首屏上下文及站内导航共同触发问题。最小修复为通过现有 `metaOnly` 注入生产文章集合，不能仅在 dev 验收。

## 历史与边界

`.trellis/tasks/07-21-spa-nav-stale/prd.md` 曾记录固定上下文引起文章内容滞留，本次无需重写已有文章正文逻辑。分类/标签/系列页注入筛选子集的潜在问题仅经代码检查发现，未复现，不纳入本次修复。

相关规范：`.trellis/spec/frontend/index.md`、`ssg-pipeline.md`、`component-guidelines.md`、`quality-guidelines.md`、`content-validation.md`。主要约束是正文按页分发、不请求全站运行时数据、保留生产可见性过滤，以及隔离构建验证。
