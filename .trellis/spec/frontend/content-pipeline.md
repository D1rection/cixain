# Content Pipeline

> How Markdown becomes HTML in this project.

## Build Script: `scripts/build-posts.js`

```
content/posts/*.md
  → gray-matter (frontmatter extraction)
  → unified + remark-parse + remark-math + remark-obsidian-link + remark-image-pipe + remark-rehype + rehype-katex + rehype-shiki + rehype-image-lazy + rehype-stringify
  → output:
    content/posts.json         — all articles metadata
    content/posts/[slug].html  — compiled body HTML
    content/pages/about.html   — static pages
```

### Processing Rules

- **Frontmatter required fields**: `title`, `date`, `description`
- **Optional fields**: `category`, `tags`, `draft`, `cover`, `series`, `seriesIndex`
  - `series`: 系列名（字符串，key = 显示名）；不写 = 非系列文章
  - `seriesIndex`: 系列内显式顺序，缺省按日期；「第 N 节」= 排序后位置序号
  - 系列排序：`seriesIndex` 优先，无则日期（见 `src/utils/series.js` 的 `sortSeries`）
- **Draft handling**: Draft articles (`draft: true`) are excluded in production builds but included in dev
- **Future dates**: Articles with future `date` are filtered out
- **Slug**: Derived from filename (strip `.md`)
- **Sorting**: Articles ordered by `date` descending
- **Line breaks**: `remark-breaks` converts single newlines to `<br>` (matching Obsidian behavior).
- **Code highlighting**: shiki with `github-dark` theme
- **Copy button**: `rehypeCopyButton` wraps each `<pre>` in `<div class="pre-wrapper">` and appends `<button class="copy-btn">复制</button>` as sibling. The `pre-wrapper` has `position: relative` so the button stays fixed during horizontal scroll.
- **Highlight**: `==text==` via custom `remarkHighlight` plugin → `<mark>text</mark>`. Skips `inlineCode` nodes.
- **Math rendering**: KaTeX via `remark-math` + `rehype-katex` (strict: false). Supports `$...$` inline and `$$...$$` display math. Font CSS imported globally via `katex/dist/katex.min.css`.
  - **同行 `$$...$$` → display**：remark-math 把同行 `$$` 解析为 inlineMath（不含定界符信息），`remarkInlineDisplayMath` 插件用 `node.position` 回溯源码判断定界符，`$$` 转 `math` 节点（hName 用 `code` + class `math-display`，phrasing 避免段落撕裂），`$` 保持 inlineMath。代码块/行内代码中的 `$$` 不产 inlineMath，天然免疫。**禁止**用字符串正则替换 markdown 源码处理公式（会破坏代码块）。
- **参考板块**: `rehypeRefSection` 识别标题文本**精确等于** `参考`/`参考资料`/`References`（h2/h3）且下一元素兄弟为 `ol` → `ol` 加 `ref-list`、标题加 `ref-heading`。归一化把两行式条目（`1. 标题\n   url`，依赖 `remark-breaks` 的 `<br>`）拆成 标题段 `<p>` + `<p class="ref-url">`，兼容宽松列表（li 含 p）与紧凑列表（li 直接内联）两种形态；多段落条目取最后一个 `<p>` 为 ref-url。列表内所有 `<a>` 注入 `target="_blank"` + `rel="noopener noreferrer"`。标题不精确匹配（如「参考实现」）或后跟非列表不命中。
  - **移动端防溢出**：`.content` 与 `.ref-list p` 均设 `overflow-wrap: anywhere`（`.ref-url` 不用 `word-break: break-all`，断行更自然）。长 URL 作标题/正文链接时不撑开页面。
- **Image positioning**: via custom `remarkImagePipe` plugin. Alt text `left`/`right`/`center` sets position. Pipe suffix `|400` sets width. Examples:
  - `![left](url)` / `![right](url)` — float, no alt text
  - `![left|400](url)` — float + 400px width
  - `![|300](url)` — center + 300px width
  - `![](url)` / `![alt](url)` — center, alt text preserved
  - CSS classes: `img-center` (block, centered), `img-left` (block, left-aligned), `img-right` (block, right-aligned)
- **图片懒加载**: `rehypeImageLazy`（插件链末尾，`rehypeImageLightbox` 之后）对外链 http(s) 图做懒加载改造：
  - **尺寸解析**：`fetchImageDimensions(url)` 发 `Range: bytes=0-2047` 请求（jsDelivr 支持 206），解析 PNG（偏移 16/20 u32BE）/JPEG（扫 SOF0/1/2）/WebP（VP8X/VP8/VP8L）/GIF（偏移 6/8 u16LE）；构建内 `dimCache` 按 URL 去重（dev HMR 复用进程）
  - **属性注入**：`src` = 占位图 data URI、`data-src` = 原图、`width`/`height`、class 追加 `lazy`；保留 `img-*` 定位类与管道宽度
  - **比例换算**：管道宽度存在 → `width` 保持管道值（HTML 属性语义不变），`height = round(管道宽 × h/w)`；无管道 → 真实尺寸（CSS `max-width:100%` 按属性比例缩放）。**width/height 必须同源同比例**，否则浏览器 aspect-ratio 错误导致 CLS
  - **宽松降级**：下载/解析失败、非 http(s)、data URI → 跳过该图（原样直接加载），构建不失败，`console.warn`；尺寸为 0/非有限一律视为失败（防 `height="NaN"`）
  - **unified 插件坑**：`.use()` 需要同步拿到 transformer——`rehypeImageLazy` 外层必须是非 async 工厂返回 async transformer；写成 `async function` 会返回 Promise 被静默跳过
- **占位图（`src/utils/placeholderUri.js`，唯一来源）**：终端风 SVG（`cicada@blog:~$ loading` + CSS 闪烁光标，`prefers-reduced-motion` 关动画）；暗版 `#0c0c0a/#3a3a35`（默认）、亮版 `#f4efe6/#b8b3ab`。构建脚本与客户端共用本模块。错误图（`ERROR_URI`，lazyImages.js）同构图、`✗ failed to load image` 低饱和红
- **客户端运行时（`src/utils/lazyImages.js`）**：`initLazyLoad()`（vanilla-lazyload@12，`elements_selector:'img.lazy'`、`threshold:200`、`callback_error`→`.error` 类 + ERROR_URI + warn）；`updateLazyLoad()`（dev 内容晚注入/路由切换后重扫）；`setPlaceholderTheme(theme)`（主题切换时仅替换 src 仍为 data URI 的占位图，已加载/加载中/错误态天然免疫）。App.jsx 在 theme 变化时调用。**不要用 `typeof IntersectionObserver` 做 init 守卫**——无 IO 时恰需实例化让库走 `loadAll()` 全量加载降级（用 `typeof window` 仅防 SSR）
- **懒加载 CSS（PostContent.module.css）**：`img.lazy { object-fit:cover; opacity:1 }`（占位图可见）、`.loaded` 用 fade-in 动画（占位 → 淡入观感）、`.error { opacity:1 }`
- **React 19 坑（SegmentsRenderer）**：`dangerouslySetInnerHTML` 的 diffProperties **不做值比较**，对象引用变化即无条件重设 innerHTML → 重建全部子节点（懒加载图片被重置回占位态）。**必须 memo 该对象**（`useMemo(() => ({__html: content}), [content])`），并可在内容渲染后调 `updateLazyLoad()` 兜底
- **react:xxx**: Code blocks tagged with `react:ComponentName` are extracted into `interactive` metadata and replaced with `data-interactive` DOM placeholders in the HTML output

## OG 分享卡片（`scripts/generate-og.js`）

- 构建链位置：`build-posts.js` 之后、`vite build` 之前（依赖 posts.json，产物进 `public/` 随 vite 复制到 dist）
- 引擎 @vercel/og（Satori + 内嵌渲染器），模板 htm + React.createElement（多子节点 div 必须显式 `display: flex`；文本插值包成单表达式避免多文本子节点）
- 为每篇非 draft 文章生成 `public/og/<slug>.png` + 站点通用图 `public/og/default.png`（1200×630）
- **卡片样式**（shadcn 风格 + 主页背景三层复刻）：背景 = `#0c0c0a` + 固定背景图 `public/og/bg.png`（本地文件，cover 平滑，注意 satori 不支持 `inset` 简写需显式 top/left + width/height）+ 92% 纯色遮罩（复刻 global.css body::after opacity 0.92）；标题得意黑斜体（72px，长标题 56px，`wrapTitle` 两行上限，行宽按字号折算）；摘要/信息行阿里普惠体 Bold
- **cover 覆盖**：frontmatter `cover` 存在 → 跳过生成，og:image 指向 cover（相对路径按 `SITE_URL + /` 归一为绝对 URL）
- 幂等：同 slug 覆盖写，删除不再需要的旧图（`bg.png` 保留）
- 字体：完整字体直接加载（不子集化），得意黑 `SmileySans-Oblique.ttf` + 普惠体 `AlibabaPuHuiTi-3-85-Bold.ttf` 存 `scripts/assets/fonts/`（OFL 开源）
- 阅读时长：构建产物 HTML 去标签后按 400 字/分钟估算
- meta 注入（static-renderer.js）：文章页 `og:image = SITE_URL + /og/<slug>.png`（或 cover），首页/分类/标签/404 用 `default.png`；补 `og:image:width/height/type/alt`、`og:site_name`、`og:locale=zh_CN`、`twitter:card=summary_large_image` 全套；JSON-LD 补 `image`/`publisher`/`mainEntityOfPage`
- **博客标准 meta 增强**：所有页面 `rel="canonical"`；`theme-color` 亮 `#f4efe6`/暗 `#0c0c0a`（prefers-color-scheme）；文章页 `article:published_time`/`article:author`/`article:section`(category)/`article:tag`(tags)；JSON-LD 文章页 `Article`→`BlogPosting` + `BreadcrumbList`（首页>系列[或分类]>文章，系列 URL 用 encodeURIComponent 与 ToC 一致）；首页注入 `WebSite`（无 SearchAction，搜索为前端弹层无 URL 端点）

### Dev vs Production

| Mode | Content rebuild | Draft included |
|------|----------------|---------------|
| Dev (`--dev` flag) | On file change via Vite plugin + HMR | Yes |
| Production | One-time at build start | No |
