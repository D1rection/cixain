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
- **Optional fields**: `category`, `tags`, `draft`, `cover`, `series`, `seriesIndex`, `source`, `difficulty`, `url`, `updated`
  - `category`: 分类值须在 `src/config.js` 的 `SITE.categories` 中登记（导航/计数/SSG 分类路由/sitemap 均由此驱动，禁止在脚本里硬编码分类列表）。`Soln`（题解）为**首页隐藏分类**：判断源是 `SITE.homeExcludedCategories`，首页列表/分页排除，仅从 `/category/Soln` 分类页进入；归档/标签/搜索/相关推荐保留；feed.xml 排除
  - `updated`: Obsidian 更新时间插件（update-time-on-edit）在保存文章时写入 frontmatter，**格式必须 `YYYY-MM-DD` 纯日期**（带时间无时区格式在北京夜间会跨天，CI UTC 解析差一天）；不写 = 无更新时间
  - `series`: 系列名（字符串，key = 显示名）；不写 = 非系列文章
  - `seriesIndex`: 系列内显式顺序，缺省按日期；「第 N 节」= 排序后位置序号
  - 系列排序：`seriesIndex` 优先，无则日期（见 `src/utils/series.js` 的 `sortSeries`）
  - `source`/`difficulty`/`url`（算法题帖 meta，平铺键值、一个信息点一个空）：透传 posts.json → `BlogPost` 顶部渲染 `ProblemMeta` 信息条（来源徽章/难度色标/原题链接）；三字段全缺则不渲染，旧文章零影响。难度色标仅 LC 三档（Easy/Medium/Hard）
- **`updated`（frontmatter 来源，可选）**: 由 Obsidian 插件在保存时写入文章 frontmatter（`YYYY-MM-DD`）；构建时 `normalizeDate` 复用 `parseDate` 语义（YAML Date 午夜 UTC → 北京时间），固定 +08:00 输出 `YYYY-MM-DD` 注入 posts.json；frontmatter 无 `updated` → `null`。**禁用文件 mtime 与 git 提交时间**（CI 浅克隆会让 `git log` 全部返回 HEAD 提交日、checkout 重置 mtime，均不可靠）。前端只在与 `date` 不同日时展示"更新于 …"
- **Draft handling**: Draft articles (`draft: true`) are excluded in production builds but included in dev
- **Future dates**: Articles with future `date` are filtered out
- **Slug**: Derived from filename (strip `.md`)
- **Sorting**: Articles ordered by `date` descending
- **日期展示**：前端展示必须按 frontmatter 的 `YYYY-MM-DD` 日历日期解析，禁止直接调用 `toLocaleDateString()` 或本地 `getDate()` 处理 UTC 零点字符串；SSR 与客户端共享的名称排序也必须使用 locale-independent 比较，保证水合顺序一致。
- **Line breaks**: `remark-breaks` converts single newlines to `<br>` (matching Obsidian behavior).
- **折叠块（`> [!fold]`，算法题帖题干）**: 写作 `> [!fold] 标题` callout（Obsidian 原生渲染，双端一致；参考 [Obsidian Callouts](https://obsidian.md/help/callouts)）；`rehypeCallout` 命中 `type === 'fold'` 时把 blockquote 转成 `<details class="fold">`/`<summary>`（默认收起），标题取首个 `<br>` 前的节点（空则「题目描述」），其后段落/列表/公式等 children 全部移入 details，`[!fold]` 前缀先行剥离。块内是正常 markdown（KaTeX 在 rehypeCallout 之后运行，details 内公式正常）。**不要用 raw HTML `<details>` 写作**：CommonMark 把 `details` 列为 HTML 块排除标签，且 `remark-rehype` 默认丢弃 raw HTML（allowDangerousHtml 关闭）——fold callout 是折叠的唯一入口。折叠样式在 `PostContent.module.css` 的 `.content details`——**选择器不能用 `details.fold`**：CSS Modules 会把 `.fold` 哈希化而元素上是明文 class，永远匹配不上；块内段落/代码用半节奏（14px）收紧。
- **Code highlighting**: shiki with `github-dark` theme
- **Copy button**: `rehypeCopyButton` wraps each `<pre>` in `<div class="pre-wrapper">` and appends `<button class="copy-btn">复制</button>` as sibling. The `pre-wrapper` has `position: relative` so the button stays fixed during horizontal scroll.
- **Highlight**: `==text==` via custom `remarkHighlight` plugin → `<mark>text</mark>`. Skips `inlineCode` nodes.
- **Math rendering**: KaTeX via `remark-math` + `rehype-katex` (strict: false). Supports `$...$` inline and `$$...$$` display math. Font CSS imported globally via `katex/dist/katex.min.css`.
  - **同行 `$$...$$` → display**：remark-math 把同行 `$$` 解析为 inlineMath（不含定界符信息），`remarkInlineDisplayMath` 插件用 `node.position` 回溯源码判断定界符，`$$` 转 `math` 节点（hName 用 `code` + class `math-display`，phrasing 避免段落撕裂），`$` 保持 inlineMath。代码块/行内代码中的 `$$` 不产 inlineMath，天然免疫。**禁止**用字符串正则替换 markdown 源码处理公式（会破坏代码块）。
- **参考板块**: `rehypeRefSection` 识别标题文本**精确等于** `参考`/`参考资料`/`References`（h2/h3）且下一元素兄弟为 `ol` → `ol` 加 `ref-list`、标题加 `ref-heading`。归一化把两行式条目（`1. 标题\n   url`，依赖 `remark-breaks` 的 `<br>`）拆成 标题段 `<p>` + `<p class="ref-url">`，兼容宽松列表（li 含 p）与紧凑列表（li 直接内联）两种形态；多段落条目取最后一个 `<p>` 为 ref-url。列表内所有 `<a>` 注入 `target="_blank"` + `rel="noopener noreferrer"`。标题不精确匹配（如「参考实现」）或后跟非列表不命中。
  - **移动端防溢出**：`.content` 与 `.ref-list p` 均设 `overflow-wrap: anywhere`（`.ref-url` 不用 `word-break: break-all`，断行更自然）。长 URL 作标题/正文链接时不撑开页面。
- **块引用（block reference，Obsidian `^id`）**: 写作 `[[文章名#^块id]]`（可带 `|别名`，别名缺省时渲染目标文章标题）；目标处由 Obsidian "Copy link to block" 在块末写 `^id` 标记。
  - **toLink 契约**：`remark-obsidian-link@0.2.4` 回调为 `(wikiLink: {value, alias}) => ({value, uri})`（内部 `m.link(uri,...)`）。**旧写法 `(slug, text) => ({href, children})` 与其不符，`uri` 恒 undefined，`[[...]]` 会渲染报错/失效**——见 `makeToLink`。无 alias 显示目标标题：构建期预扫全部文章 frontmatter（含 draft）成 `slug→title` Map。
  - **id 必须在 rehype 链末端（shiki/katex/copyButton 之后）挂**：`rehype-shiki` 重建 `<pre>`、`rehype-katex` 整体 splice 替换公式元素，先于它们打 id 必被丢弃。`rehypeBlockRef` 处理两种落盘形态：独立行 `^id` → 挂上方最近块（顶层为 `div.pre-wrapper` / `span.katex-display` / 列表 / 标题 / 段落……）；块末行尾 ` ^id` → 该块自身（含列表项内嵌）。
  - **shiki 会把 pre 包进一个嵌套 root 节点**：`rehypeBlockRef` 先就地摊平嵌套 root（splice 展开），否则「上方最近块」会跳过整个代码块、id 错挂到前面的标题。
  - **失效校验**：构建期扫全部 `[[slug#^id]]` —— 目标文章不存在 / 目标块不存在（draft 不编译故无 id 定义，引用到草稿也会报此条）/ 同页重复 id → `console.warn` 汇总「N 条失效引用」，不阻断构建。
  - **客户端 `useHashScroll`**：内容渲染 + 懒加载图片落定后 `scrollIntoView(block:'center')` 把目标块置于视口垂直中心，目标块加 `targetFlash` 类做 outline 外发光渐隐（2s）；`hashchange` 监听覆盖同文自引用 / 前进后退。位置对齐用 center，不需要 scroll-margin（区别于 TOC 的 start 对齐 + 标题内联 60px 偏移）。
  - **unified 插件注册坑**：`.use(plugin, opts)` 传工厂本体；`.use(plugin(opts))` 会把已执行结果当工厂调用（此时 transformer 收到的是 processor 对象，`tree.children` undefined 直接崩）——本坑曾导致 `Cannot read properties of undefined (reading 'children')`。
- **Image positioning & explicit dimensions**: via custom `remarkImagePipe` plugin. Alt text `left`/`right`/`center` sets position. **尺寸由作者在 markdown 显式声明，构建期零网络解析**——管道语法 `![|pos w h]`（位置可选、缺省 center；宽必填、高可选；分隔符空格 / `x` / `×`）。有高才写 `height` 属性；缺高 → 无 `height`，占位盒按占位图固有 4:3 预留（预设盒语义）。举例及产物属性：
  - `![|600 400](url)` → `width="600" height="400"`（精确盒，作者比例写对则零 CLS）
  - `![|600](url)` → `width="600"`（无 `height`，4:3 预设盒，加载时一次轻微跳动）
  - `![|left 300 200](url)` → `class="img-left" width="300" height="200"`
  - `![left|400](url)` → `class="img-left" width="400"`（历史语法，位置在管道前）
  - `![right](url)` → `class="img-right"`（无尺寸）
  - `![](url)` / `![alt](url)` → 无尺寸属性（容器宽 × 4:3 预设盒）
  - CSS classes: `img-center` (block, centered), `img-left` (block, left-aligned), `img-right` (block, right-aligned)
- **图片懒加载（纯同步、零网络）**: `rehypeImageLazy`（插件链末尾，`rehypeImageLightbox` 之后）只做占位改造，**不再做任何构建期尺寸解析**（旧 `fetchImageDimensions`/`dimCache`/PNG/JPEG/WebP/GIF 解析已删除）：
  - **属性注入**：对外链 http(s) 图 `src` → 占位图 data URI、`data-src` = 原图、class 追加 `lazy`；**保留** `remarkImagePipe` 已从 markdown 写入的 `width`/`height` 属性（含缺高时「不写 `height`」→ 4:3 预设盒语义）
  - **跳过**：非 http(s) / data URI / 已有 `data-src` 的图原样直接加载
  - **unified 插件坑**：`.use()` 需要同步拿到 transformer——`rehypeImageLazy` 外层必须是非 async 工厂返回**同步** transformer；写成 `async function` 会返回 Promise 被静默跳过（reminder：插件链里 lightbox 等必须在它之前，见下）
- **占位图（`src/utils/placeholderUri.js`，唯一来源）**：终端风 SVG（`cicada@blog:~$ loading` + CSS 闪烁光标，`prefers-reduced-motion` 关动画）；暗版 `#0c0c0a/#3a3a35`（默认）、亮版 `#f4efe6/#b8b3ab`。构建脚本与客户端共用本模块。错误图（`ERROR_URI`，lazyImages.js）同构图、`✗ failed to load image` 低饱和红
- **客户端运行时（`src/utils/lazyImages.js`）**：`initLazyLoad()`（vanilla-lazyload@12，`elements_selector:'img.lazy'`、`threshold:200`、`callback_error`→`.error` 类 + ERROR_URI + warn）；`updateLazyLoad()`（dev 内容晚注入/路由切换后重扫）；`setPlaceholderTheme(theme)`（主题切换时仅替换 src 仍为 data URI 的占位图，已加载/加载中/错误态天然免疫）。App.jsx 在 theme 变化时调用。**不要用 `typeof IntersectionObserver` 做 init 守卫**——无 IO 时恰需实例化让库走 `loadAll()` 全量加载降级（用 `typeof window` 仅防 SSR）
- **懒加载 CSS（PostContent.module.css）**：`img.lazy { object-fit:cover; height:auto; opacity:1 }`（占位图可见）、`.loaded` 用 fade-in 动画（占位 → 淡入观感）、`.error { opacity:1 }`
  - **height:auto 必须保留**（否则移动端裁剪）：`height` 属性是显式高度，容器收缩宽度时（如 600px 图在 326px 容器）高度不跟随，盒比例失真 + `object-fit: cover` 会把真实图裁成局部；`height:auto` 让 height 属性退化为比例提示，浏览器按属性比例自动换算高度
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
