# 块级引用调研记录

> 任务 `08-19-block-ref` 的调研与可行性依据。结论经与用户逐项 grill 收敛，最终方案见 `prd.md`。

## 功能命名

- **Web 通用**：深链锚点 / 锚点链接（deep link / fragment anchor link）——链接携带 `#fragment` 定位页面内位置。
- **文档站**：交叉引用（cross-reference）。主流程静态站点生成器均有原生支持：
  - Zola：构建期自动为标题注入 anchor + 站内链接语法（`[文字](@/posts/x.md#heading)`）。
  - MkDocs：mkdocs-autorefs 插件跨页自动生成引用链接。
  - Hugo：`ref` / `relref` shortcode 解析目标页面 + anchor。
- **笔记软件（本博客写作流所在）**：
  - wikilink heading anchor：Obsidian `[[页面#标题]]`。
  - **块引用（block reference）**：Obsidian `[[页面#^块id]]`（块 id 呈 `^abc123` 形态，由 "Copy link to block" 生成并写入源文件）；Notion「复制块链接」、Roam 引用块同思路。

## 两档粒度及其成本

| 粒度 | 做法 | 成本 |
|---|---|---|
| 标题级 | 标题生成稳定 slug id，链接 `[文字](文章#id)` 或 `[[文章#标题]]` | 低，主流做法 |
| 块级 | 每个块发独立 id，可引用任意位置 | 高，需自建 id 体系；Obsidian/Notion 级 |

块级在多数静态博客偏贵的原因：id 体系要自造。本项目的特例是写作工具 Obsidian 原生提供 `^id` 生成与链接拷贝，id 落在 md 文件里，构建器只读即可——大幅摊薄成本。

## 本项目现状勘察（代码实测）

- `scripts/build-posts.js` 已挂 `remark-obsidian-link`（`.use(remarkObsidianLink, { toLink: (slug, text) => ({ href, children }) })`），但：
  - 实测安装版本 `remark-obsidian-link@0.2.4` 的 `toLink` 契约为 `(wikiLink) => ({ value, uri })`（见其 dist/index.js 源码），返回结构应为 `{ value, uri, title? }`（mdast-builder `m.link`），与项目现有签名/返回结构均不符；当前写法 `href` 键会被忽略、`uri` 为 undefined，渲染阶段会报错。
  - 存量正文 grep `[[` 无命中 → 插件路径从未触发，问题隐藏至今。
  - 实证：`remark-wiki-link@2.0.1`（内部依赖）原生解析 `[[foo#^id]]` 与 `[[foo#标题]]`，`value = "foo#^id"`，href 输出 `/blog/foo#%5Eid`（`^` 被百分比编码）——语法层通，需在 toLink 中把 `^` 前缀从 fragment 剥掉。
- 标题 id：`useHeadingAnchors`（客户端渲染期）为正则匹配注入 h2–h6 的 slug id（自研 slugify：小写、空白转 `-`、保留汉字、去重后缀），并带 `scroll-margin-top: 60px`。块级 id 与此体系正交，不动。
- 滚动：`ScrollToTop` 已放行带 hash 的路由（`if (location.hash) return`），但 SPA 下浏览器原生锚点滚动会因内容异步渲染而失效，需内容就绪后再主动 `scrollIntoView`；懒加载图片（占位符预留尺寸，CLS 已控）落定后布局才稳定，定位需等待其完成。
- 样式：callout / blockquote 已有背景色；目标块高亮需与其兼容（叠加半透明或 outline 方案）。

## 方案推导（grill 结论）

| 决策点 | 结论 | 理由 |
|---|---|---|
| 粒度 | 块级 | 需求即「引用某处内容」；Obsidian 工作流使其成本可控 |
| id 来源 | Obsidian `^id` 写入源文件 | 零写作摩擦、零自建 id 体系 |
| 可挂类型 | 全部块（段/标题/列表项/代码块/公式块/引用与 callout） | 与 Obsidian 语义一致，规则统一 |
| 语法 | 只认 `[[文章#^id]]`（可带 `\|别名`） | 单一机制；Obsidian 拷贝产物即此形态 |
| 无 alias 显示 | 目标文章标题 | 构建期可读 frontmatter，与 Obsidian 显示一致 |
| 落地体验 | 平滑滚动 + 目标块高亮渐隐 | 可感知的跳转反馈 |
| 失效引用 | 构建期 warn 汇总，不阻断 | 出错可知、发布不卡 |
| 不做（二期） | 悬停预览、`#标题文本` 兼容、代码行级锚点 | 控制本期范围 |

## 可行性总结

- 构建侧：1 个对 `remark-obsidian-link` 的 toLink 契约修复 + 1 个 mdast 层 `^id` 归属插件（`^id` 挂上方最近块）+ 失效校验扫描；目标标题经预建 slug→title Map 解析。
- 前端：1 个滚动定位 hook（内容/图片就绪后 `scrollIntoView` + 临时高亮 class）；`:target` 样式兜底。
- 无新依赖、无运行时 fetch、存量零回归。