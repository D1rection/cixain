# PRD: 统一页面数据加载方式

## 问题
Dev SPA 模式下，静态页面（如 `/about`）的内容无法加载，因为页面数据仅以 `.html` 文件形式存在，SSG 从文件读取注入到 `__BLOG_DATA__`，但 dev 模式没有这个通道。

当前 hack：dev 模式用 `import.meta.glob` + `?raw` 加载 `.html` 文件。不优雅。

## 方案
让 `scripts/build-posts.js` 处理页面时，同时输出 JSON 格式的页面数据（如 `content/pages.json`），dev 模式直接导入该 JSON，SSG 也从中读取。

这样 dev 和 SSG 共用同一数据源，main.jsx 不再需要黑科技。

## 约束
- SSG 输出保持不变（即 `static-renderer.js` 仍能正确生成每个页面的 HTML）
- 不引入新依赖
- 修改尽量小

## 验收标准
- [ ] Dev 模式 `/about` 页面正常显示内容
- [ ] 生产构建后 `/about` 页面正常显示内容
- [ ] `scripts/build-posts.js` 在页面处理后输出 `content/pages/pages.json`
- [ ] `src/main.jsx` dev 分支从 `pages.json` 读取页面内容
- [ ] `scripts/static-renderer.js` 从 `pages.json` 读取页面内容（替代直接读 `.html` 文件）
- [ ] 删除旧 hack（`import.meta.glob`）
- [ ] `content/pages/*.html` 文件保留（可被构建脚本覆盖）
