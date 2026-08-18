# PRD: Obsidian 标注渲染

## 问题

Markdown 中的 `> [!note]` / `> [!warning]` 等 Obsidian 标注语法，构建时被当作普通 blockquote 渲染，没有特殊样式。

## 方案

新增 remark 插件 `remarkCallout`，在构建时将 Obsidian 标注语法解析为带 `data-callout` 属性的 blockquote，配合 CSS 渲染出带图标和颜色的标注框。

### 改动范围

| 文件 | 改动 |
|------|------|
| `scripts/build-posts.js` | 新增 `remarkCallout` 插件，加入 pipeline |
| `src/styles/global.css` | 标注框样式（`.content [data-callout]`） |
| `templates/callout.md` | 标注用法模板 |

### 语法支持

```markdown
> [!note] 可选标题
> 内容文字

> [!warning]
> 没有标题的标注

> [!tip] 提示
> 提示内容
```

支持类型：`note`, `warning`, `tip`, `info`, `danger`, `abstract`, `question`, `failure`, `bug`, `example`, `quote` — 每种对应不同颜色。

### 设计

**remark 插件流程**：
- 遍历 AST
- 匹配 `blockquote` 首行 `[!TYPE]` 语法
- 提取 type 和可选 title
- 在 blockquote 节点注入 `data-callout` + `className: ['callout']`
- 有 title 时，将首段转为 `callout-title`

**CSS 样式**：
- 左边框加粗 + 着色（类似 blockquote 但更明显）
- 每种类型不同颜色（`--callout-note`, `--callout-warning` 等）
- 带图标或 emoji 前缀（通过伪元素或 data-callout 属性选择器）
- 背景微色差
- 保持 `--color-bg` / `--color-text` 适配深浅主题
