# 块级引用（Obsidian `^id` 锚点跳转）— 技术设计

## 数据流

```
写作（Obsidian）                         构建期（build-posts.js）                  运行时（前端）
┌─────────────────────────────┐   ┌──────────────────────────────────┐   ┌────────────────────────┐
│ 目标文: 某块后写 ^abc123     │ → │ remarkBlockId: ^id → 块元素 id    │ → │ 静态 HTML 已含 id="abc" │
│ 来源文: [[目标文#^abc123]]   │ → │ toLink: → <a href="/blog/目标#abc">│ → │ useHashScroll 定位+高亮 │
└─────────────────────────────┘   └──────────────────────────────────┘   └────────────────────────┘
```

## 1. 构建期（`scripts/build-posts.js`）

### 1.1 修复 `remarkObsidianLink` 的 toLink 契约

- 现状（失效）：`.use(remarkObsidianLink, { toLink: (slug, text) => ({ href, children }) })`
  与安装版 `remark-obsidian-link@0.2.4` 的实际契约不符：库调用 `toLink({ value, alias })` 且要求返回
  `{ value, uri, title? }`（内部 `m.link(uri, title, [text(value)])`）。当前写法 `uri` 恒为 undefined，渲染即崩；
  存量无 `[[` 内容，从未触发。
- 修复：`toLink(wikiLink)`，解析 `wikiLink.value`：
  - `slug#^id`（fragment 以 `^` 开头）→ 块引用：`uri = /blog/<slug>#<id>`（剥 `^`），
    `value = alias || titles.get(slug) || slug`；同时收集引用进 `refs`（含来源 slug）供校验。
  - `slug`（无 fragment）→ 普通互链：`uri = /blog/<slug>`，`value = alias || titles.get(slug) || slug`。
  - `slug#其它`（非 `^` 片段）→ 本期不按块处理，**保留 fragment 原样进 href**（意图保留，命中即得，不命中停页顶），
    `value` 同上。
  - `^id`（无 `#`，Obsidian 同文引用形态）→ `uri = /blog/<当前文章>#<id>`，防误当 slug。
- `titles`：构建循环前预扫描全部 md 的 frontmatter（**含 draft**，写作期引用草稿合理）→ `Map<slug, title>`。

### 1.2 新增 `remarkBlockId(slug, defs)`（mdast 层，remarkRehype 之前）

Obsidian 语义：`^id` 属于其上方最近的块。支持两种落盘形态（Obsidian Copy link to block 均可能产生）：

- **行尾附缀**：paragraph / heading 的最后一个 text 节点尾部匹配 ` /\s\^([A-Za-z0-9_-]+)\s*$/` → 剥离标记，id 挂**自身**。
- **独立标记行**：paragraph 恰为 `^[A-Za-z0-9_-]+` → 删除该段，id 挂**上方最近块**；上方无块则挂下方最近块。
  - 前块为 `list` → 挂其最后一个 `listItem`（列表项定位）。
  - math 块（`$$...$$`，已由 remarkInlineDisplayMath 转为 flow math 节点）→ 直接挂 math 节点
    （`data.hProperties.id`，remark-rehype 对自定义 hName 节点同样生效）。
- id 注入统一走 `node.data.hProperties = { ...既有, id }`（不覆盖既有 hProperties，如图片管道/公式类）。
- 每篇 id 收集进 `defs` 数组（进 posts.json 的是编译产物列表；draft 不编译 → 无 defs）。

### 1.3 失效校验（全部编译完成后）

- 遍历 `refs`：目标 slug 不在 `titles` → warn「目标文章不存在」；`idDefs.get(slug)` 缺该 id → warn「目标块不存在（文章为草稿或无此 ^id）」。
- `idDefs` 各文内重复 id → warn。
- 末尾汇总「N 条失效块引用」。全部 warn，不阻断构建（含 dev 模式）。

## 2. 前端

### 2.1 `src/hooks/useHashScroll.js`（新增）

- 依赖 `processedHtml`（内容就绪信号）；`location.hash` 匹配 `/^#([A-Za-z0-9_-]+)$/`（块 id 字符集）。
- 定位时机：等懒加载图片落定（`img.lazy:not(.loaded)` 集合，逐个 load/complete，800ms 兜底超时）→
  `scrollIntoView({ behavior:'smooth', block:'center' })`（目标块置于视口垂直中心，用户偏好）→
  目标元素加高亮类 `targetFlash`，2s 后移除。TOC 锚点（`block:'start'` + headline 内联 60px 偏移）保持独立。
- 监听 `hashchange`：同文自引用（`<a href="/blog/同篇#id">` 触发 pathname 相同、hash 变化的导航）与浏览器前进后退也能触发定位 + 高亮。
- 清理：卸载时移除监听 / 清 timeout / done 标志防重复。

### 2.2 `BlogPost.jsx`

- 引入 `useHashScroll(processedHtml, contentRef, styles.targetFlash)`；`contentRef` 已存在（ToC 共用）。
- 不触碰 `useHeadingAnchors` / `ScrollToTop`（后者已放行带 hash 路由）。

### 2.3 `PostContent.module.css`

- `.targetFlash` 局部类 + `@keyframes targetFlash`：**outline 外发光**动画（accent 半透明 → transparent，2s ease-out）。
  选 outline 而非 background/box-shadow：blockquote/callout 已有背景与硬阴影，动画 outline 零冲突。
- `.content :global([id]) { scroll-margin-top: 60px }`：给带 id 的块补 60px 滚动偏移（与标题锚点一致，绕开固定头）。

## 3. 兼容与回归

- 无新依赖、无 schema 变更、无运行时 fetch（目标标题构建期解析）。
- 存量无 `[[`，插件修复零回归；`useHeadingAnchors`/ToC/懒加载全不动。
- draft 文章：titles 含它（链接可解析），但无 id 定义 → 引用会被校验 warn（合理：未发布无可跳目标）。

## 4. 回滚

纯构建 + 前端改动，无迁移：revert 提交即回滚。