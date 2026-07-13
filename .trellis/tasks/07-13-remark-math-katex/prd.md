# PRD: 支持 KaTeX 数学公式渲染

## 需求

Obsidian 导出的 markdown 中包含 LaTeX 数学公式（`$...$` 行内、`$$...$$` 块级），目前 blog 编译流水线不做处理，公式以纯文本显示。需要接入 KaTeX 在构建期完成渲染。

## 约束

- 只能用 KaTeX（构建时静态渲染），不引入客户端 JS 方案
- 改动范围尽量小，只动编译流水线 + 加 CSS import

## 改动范围

| 文件 | 改动 |
|------|------|
| `package.json` | 新增依赖 `remark-math`、`rehype-katex`、`katex` |
| `scripts/build-posts.js` | 编译流水线插入 `remarkMath` + `rehypeKatex` |
| `src/styles/global.css` | import `katex/dist/katex.min.css` |

## 验收标准

1. 运行 `node scripts/build-posts.js --dev` 后，`content/posts/*.html` 中 `$...$` 和 `$$...$$` 被渲染为不等于纯文本的新标签
2. 前端页面中公式以正确字体样式显示，不出现纯文本 `$t = 0$` 样式
3. 对中文逗号混入公式不阻塞构建，只出 warning
