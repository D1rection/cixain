# 实施结果

用户批准实现，并要求英文保留公式字体。已修改草稿中三段说明，增加 `[!mathtext]`；英文使用普通 Markdown，公式保持原有内容。

## 字体与几何验证

浏览器字体加载确认 `KaTeX_Main` 可用。说明文字、行内数学和独立公式均为 **19.36px**，无嵌套字号倍乘。文字 span 使用 KaTeX 的 1.21em/1.2 度量，段落仍沿用原有 2.1 引用行高。

| 视口 | 主题 | 引用 client/scroll | 长句 client/scroll | 引用高度 |
| --- | --- | --- | --- | --- |
| 1440 | dark/light | 644/644 | 604/604 | 519.125 |
| 768 | dark/light | 644/644 | 604/604 | 519.125 |
| 375 | dark/light | 307/307 | 267/267 | 653.5 |

375px 的长句分为四行。第二个独立公式仍为 267/417，保持局部横向滚动。普通未标记引用没有 `.math-text`。测试标记不可见，公式没有被文字 span 包裹。

详细数据：`implemented-metrics.json`；正式效果：`implemented-1440-dark.jpg`、`implemented-1440-light.jpg`、`implemented-375-dark.jpg`。浏览器已重新加载并恢复主题/视口。

## 检查

- `npm run test:content`：23/23 通过（新增 5 项数学说明回归）。
- `npm run test:revisions`：10/10 通过。
- `node --check scripts/build-posts.js` 和 `scripts/lib/heading-links.js`：通过。
- Vite 前端生产编译：通过，产物在临时目录，没有运行部署或全量 SSG/OG 构建。项目没有 lint/typecheck 脚本。
- 新增回归覆盖标记移除、同/异行、链接/强调、代码/嵌套引用、普通 callout 保持原样、块 ID 挂载在语义段落而非字体 span。

## 兼容性修正

审查发现字体 span 若在 `rehypeBlockRef` 前生成，行尾块 ID 会挂到 span，独立 `^id` 行也无法正确移除。已将 `rehypeMathText` 放在块 ID 解析之后，并补充回归；所有检查重新通过。

未增加依赖或改变第三方 API 参数。Context7 工具在本会话不可用，插件接入模式按官方 unified 文档核对：<https://unifiedjs.com/learn/guide/create-a-rehype-plugin/>。

## 用户已有修改

编辑前已备份草稿与元数据。与编辑前草稿相比仅修改三段英文及增加标记，保留原有内容和文件尾空行；自动重建的 posts.json 将恢复编辑前内容（草稿元数据未变），不混入其它历史缓存更新。

代码、规范和任务文件可以独立提交。草稿在开始前已有 118 行未提交的新正文，不能默默将整篇正文纳入代码提交；需明确选择是否同时提交草稿。其它 Obsidian、模板、文章和 public 资源变化也不纳入本任务提交。
