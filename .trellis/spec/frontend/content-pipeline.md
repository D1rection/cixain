# Content Pipeline

> How Markdown becomes HTML in this project.

## Build Script: `scripts/build-posts.js`

```
content/posts/*.md
  → gray-matter (frontmatter extraction)
  → unified + remark-parse + remark-math + remark-obsidian-link + remark-image-pipe + remark-rehype + rehype-katex + rehype-shiki + rehype-image-lazy + rehype-stringify
  → output:
    content/posts/posts.json   — all articles metadata
    content/posts/[slug].html  — compiled body HTML
    content/pages/about.html   — static pages
```

### 碎片知识

- `content/fragment/*.md` 是独立内容集合；必需 frontmatter 为 `title`、`date`，`description` 可选（缺省从编译后正文提取）。生产构建排除草稿和未来日期，开发模式允许草稿。
- 碎片模板默认 `draft: true`，写作指南位于 `docs/writing-fragments.md`，教程不得进入模板可渲染正文。date/updated 校验与统一输出见 `content-validation.md`。
- 碎片的 `date` 表示首次公开日期（`YYYY-MM-DD`），不是提前保存草稿的日期；首次公开时应设为实际发布日期。可选 `updated` 表示最近一次实质内容更新日期（`YYYY-MM-DD`）：核心观点、解释、重要例子或依据有变化时更新，错字、排版和纯链接修复不更新。不要为此增加单独的 `created` 字段。
  ```yaml
  date: "2026-09-28"
  updated: "" # 留空，直到发生实质更新
  # 实质更新后：updated: "2026-10-03"
  ```
  碎片详情页仅在 `updated` 与 `date` 不同日时显示“更新于”；碎片集合按 `updated || date` 倒序排列。
- 每个碎片生成 `/fragment/<encoded-slug>/`、同名 HTML 和 `fragments.json`；`posts.json` 继续只表示文章。`content/registry.json` 合并当前可见文章和碎片的元数据供搜索构建使用。
- 文章与碎片中的无前缀链接 `[[文章文件名]]` 均指向文章；引用碎片使用 `[[fragment/碎片文件名]]`，也支持 `[[posts/文章文件名]]` 及 `|显示文字`。块链接支持 `[[fragment/碎片文件名#^block-id]]`、`[[^block-id]]`。块 ID 按 `post:<slug>` / `fragment:<slug>` 分开校验。
- Markdown 站内链接如果指向已注册的文章或碎片，也纳入反向引用。反向链接按来源页面去重并写入元数据；草稿/未来内容不进入生产注册表、搜索索引或反向链接。
- 内部元数据使用 `id`、`kind`、`contentUrl`；文章 frontmatter 的 `url` 仍是算法题外链，禁止覆盖。搜索注册表统一以规范地址写入 `url`。
- 碎片不参与文章分类、首页、系列、归档或 RSS；无汇总页和导航入口。写作模板见 `Templates/new-fragment.md`。

After the current article pass, `scripts/build-history.js` reads committed Git
snapshots and writes `public/history/<slug>/<generation>/`. It reuses the
Markdown compiler, strips frontmatter before hashing, filters drafts, merges
adjacent equal bodies, and adds only a small `revisionHistory` pointer to
`content/posts/posts.json`.

The history directory is generated output and is ignored by Git. It is copied
to `dist/` by Vite and fetched only after a reader selects a historical
version. A missing or mismatched artifact must never replace the latest body.

### 历史版本对比契约

`createRevisionDiff(beforeHtml, afterHtml)` 返回 `{ html, changes, changeCount }`。`changes` 是按正文阅读顺序排列的 `{ id, type }[]`，`type` 为 `added`、`removed` 或 `modified`；`changeCount` 必须等于 `changes.length`，一个连续变更区域只计一处。生成 HTML 时，区域根节点使用同一 `id`（如 `revision-change-1`），前端导航直接消费这份清单，不能再按 DOM 中的标签数量推算。

比较器必须先用完整语义块建立有序锚点，再处理锚点之间的区间。禁止固定窗口前瞻：长段新增会让后文错配。重复且信息量很低的块（例如“待续”）不能单独作为锚点，未改变的后续块必须只输出一次。

含 KaTeX、代码、图片、链接或其他富文本结构的修改必须保留旧/新完整 HTML，降级为同一变更区域中的两个内容块。禁止先把这类 HTML 通过 `textContent`/标签剥离后再生成可见差异，否则 KaTeX 的 MathML、TeX annotation 和视觉节点会重复出现或丢失语义。普通纯文本段落才允许生成 `<del>`/`<ins>` 行内标记。

比较 JSON 的 `schemaVersion` 和 `compilerVersion` 发生变化时必须生成新的 generation；前端校验 slug、generation、旧版本 ID 和当前正文 hash，失败则继续展示最新正文。

### Processing Rules

- **Frontmatter required fields**: `title`, `date`, `description`
- **Optional fields**: `category`, `showOnHome`, `tags`, `draft`, `cover`, `series`, `seriesIndex`, `source`, `difficulty`, `url`, `updated`
  - `category`: 分类值须在 `src/config.js` 的 `SITE.categories` 中登记（导航/计数/SSG 分类路由/sitemap 均由此驱动，禁止在脚本里硬编码分类列表）
  - `showOnHome`: 可选布尔值，缺省为 `true`；只有显式 `false` 的文章从首页列表/分页排除。该属性只控制首页，不影响分类、归档、标签、搜索、相关推荐、文章详情或 sitemap。题解模板默认写 `false`；RSS 仍由 `SITE.rssExcludedCategories` 独立控制
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
- **折叠块（`> [!fold]`，算法题帖题干）**: 写作 `> [!fold] 标题` callout（Obsidian 原生渲染，双端一致；参考 [Obsidian Callouts](https://obsidian.md/help/callouts)）；`rehypeCallout` 命中 `type === 'fold'` 时把 blockquote 转成 `<details class="fold">`/`<summary>`（默认收起），标题取首个 `<br>` 前的节点（空则「题目描述」），其后段落/列表/公式等 children 全部移入 details，`[!fold]` 前缀先行剥离。块内是正常 markdown（KaTeX 在 rehypeCallout 之后运行，details 内公式正常）。**不要用 raw HTML `<details>` 写作**：CommonMark 把 `details` 列为 HTML 块排除标签，且 `remark-rehype` 默认丢弃 raw HTML（allowDangerousHtml 关闭）——fold callout 是折叠的唯一入口。折叠样式在 `PostContent.module.css` 的 `.content details`——**选择器不能用 `details.fold`**：CSS Modules 会把 `.fold` 哈希化而元素上是明文 class，永远匹配不上。
  - **内部层级不进入 TOC**：题干一级分段写 `> ## 输入格式` / `> ## 示例 1` / `> ## 提示`，样例内二级分段写 `> ### 输入` / `> ### 输出` / `> ### 解释`。构建时 fold 子树内所有 `h1`–`h6` 都转成 `div.fold-heading[role="heading"][aria-level]`，并用原始标题文本写 `aria-label`；这样保留视觉与无障碍层级，但客户端 `useHeadingAnchors` 不会把题面分段加入文章 TOC。既有“独立段落中只有粗体标签”的写法仅按输入格式/输出格式/样例/提示等白名单兼容，禁止把普通强调段落泛化成标题。
  - **代码风格统一**：fold 内没有语言标记的 fenced code 在 Shiki 之前补 `language-text`，复用全站 Everforest 代码主题；题面代码隐藏行号、保持横向滚动，复制按钮在触屏环境可见。块内段落与列表使用半节奏（14px），移动端代码内边距同样收紧。
- **文章总览（`> [!overview] 总览`）**: 文章开头用于预览全文结构与阅读路线，正文保持自由 Markdown。生成器复用通用 `rehypeCallout`，输出 `blockquote[data-callout="overview"]`，构建输出保留 Lucide `route` 图标，CSS 将直接标题图标设为 1em，与标题对齐。该类型采用开放式导语：透明背景、无包围边框及阴影、左右无内缩，底部仅保留 28px 留白、无分隔线；15px 标题通过 `--callout-overview` 引用主题强调色（浅色锈红、深色绿色），15px 内容采用柔和文字色；直接子段落与列表采用 14px 块间距，明暗与移动端保持相同字号。模板示例位于 `Templates/callout.md`。
- **Code highlighting**: shiki with `github-dark` theme
- **Copy button**: `rehypeCopyButton` wraps each `<pre>` in `<div class="pre-wrapper">` and appends `<button class="copy-btn">复制</button>` as sibling. The `pre-wrapper` has `position: relative` so the button stays fixed during horizontal scroll.
- **Highlight**: `==text==` via custom `remarkHighlight` plugin → `<mark>text</mark>`. Skips `inlineCode` nodes.
- **Math rendering**: KaTeX via `remark-math` + `rehype-katex` (strict: false). Supports `$...$` inline and `$$...$$` display math. Font CSS imported globally via `katex/dist/katex.min.css`.
  - **保留公式字体的说明**：`> [!mathtext]` 是显式选择的无标题引用标记，`rehypeCallout` 移除标记并输出 `blockquote[data-mathtext]`，不生成 `data-callout`、标题或图标。标记可单独一行，也可与正文同行。`rehypeMathText` 必须在 `rehypeBlockRef` 之后运行，为直接子段落的自然语言文本生成 `span.math-text`（包含链接/强调文本，跳过公式、代码、列表与嵌套引用）；先包 span 会使 `^id` 错挂在 span 上或独立标记无法剥离。嵌套块自身有标记时独立处理。字号/行高规则见 `typography.md`；编译回归见 `tests/content/mathtext.test.mjs`。输出契约变化时更新 `CONTENT_COMPILER_VERSION`，避免复用历史缓存。
  - **同行 `$$...$$` → display**：remark-math 把同行 `$$` 解析为 inlineMath（不含定界符信息），`remarkInlineDisplayMath` 插件用 `node.position` 回溯源码判断定界符，`$$` 转 `math` 节点（hName 用 `code` + class `math-display`，phrasing 避免段落撕裂），`$` 保持 inlineMath。代码块/行内代码中的 `$$` 不产 inlineMath，天然免疫。**禁止**用字符串正则替换 markdown 源码处理公式（会破坏代码块）。
- **参考板块**: `rehypeRefSection` 识别标题文本**精确等于** `参考`/`参考资料`/`References`（h2/h3）且下一元素兄弟为 `ol` → `ol` 加 `ref-list`、标题加 `ref-heading`。归一化把两行式条目（`1. 标题\n   url`，依赖 `remark-breaks` 的 `<br>`）拆成 标题段 `<p>` + `<p class="ref-url">`，兼容宽松列表（li 含 p）与紧凑列表（li 直接内联）两种形态；多段落条目取最后一个 `<p>` 为 ref-url。列表内所有 `<a>` 注入 `target="_blank"` + `rel="noopener noreferrer"`。标题不精确匹配（如「参考实现」）或后跟非列表不命中。
  - **移动端防溢出**：`.content` 与 `.ref-list p` 均设 `overflow-wrap: anywhere`（`.ref-url` 不用 `word-break: break-all`，断行更自然）。长 URL 作标题/正文链接时不撑开页面。
- **块引用（block reference，Obsidian `^id`）**: 写作 `[[文章名#^块id]]`（可带 `|别名`，别名缺省时渲染目标文章标题）；目标处由 Obsidian "Copy link to block" 在块末写 `^id` 标记。
  - **toLink 契约**：`remark-obsidian-link@0.2.4` 回调为 `(wikiLink: {value, alias}) => ({value, uri})`（内部 `m.link(uri,...)`）。**旧写法 `(slug, text) => ({href, children})` 与其不符，`uri` 恒 undefined，`[[...]]` 会渲染报错/失效**——见 `makeToLink`。无 alias 显示本次可见 registry 中相同类型目标的标题，缺失时回退文件名；回调不保留原节点 position/data，wiki 来源需在替换前后桥接。
  - **id 必须在 rehype 链末端（shiki/katex/copyButton 之后）挂**：`rehype-shiki` 重建 `<pre>`、`rehype-katex` 整体 splice 替换公式元素，先于它们打 id 必被丢弃。`rehypeBlockRef` 处理两种落盘形态：独立行 `^id` → 挂上方最近块（顶层为 `div.pre-wrapper` / `span.katex-display` / 列表 / 标题 / 段落……）；块末行尾 ` ^id` → 该块自身（含列表项内嵌）。
  - **shiki 会把 pre 包进一个嵌套 root 节点**：`rehypeBlockRef` 先就地摊平嵌套 root（splice 展开），否则「上方最近块」会跳过整个代码块、id 错挂到前面的标题。
  - **失效校验**：文章、碎片、静态页面的 wiki 链接及站内内容 Markdown 链接共同验证。缺失/未发布目标、缺失标题或块锚点、重复块 ID：开发模式告警，生产构建非零退出，验证通过前不写生成文件；见 `content-validation.md`。
  - **客户端 `useHashScroll`**：内容渲染 + 懒加载图片落定后 `scrollIntoView(block:'center')` 把目标块置于视口垂直中心，目标块加 `targetFlash` 类做 outline 外发光渐隐（2s）；`hashchange` 监听覆盖同文自引用 / 前进后退。位置对齐用 center，不需要 scroll-margin（区别于 TOC 的 start 对齐 + 标题内联 60px 偏移）。
  - **unified 插件注册坑**：`.use(plugin, opts)` 传工厂本体；`.use(plugin(opts))` 会把已执行结果当工厂调用（此时 transformer 收到的是 processor 对象，`tree.children` undefined 直接崩）——本坑曾导致 `Cannot read properties of undefined (reading 'children')`。
- **标题锚点**：Markdown 编译在块引用处理后给 `h2`–`h6` 写入唯一 `id`，折叠题干小标题已变成 `div` 因而不参与。`useHeadingAnchors` 复用这些 ID 来生成目录；没有预置 ID 的旧 HTML 仍按同一 `slugifyHeading` 逻辑补齐。搜索索引读取编译 HTML 的 ID，避免链接锚点与目录不一致。
  - **目录显示文字**：普通正文与历史比较目录先去实际 HTML 标签，再用 `src/utils/headingText.js` 的 `decodeHeadingEntities` 解码一次，最后按各自规则处理空白；不能先解码再去标签，也不能递归解码。目录继续用 React 文本节点显示；显示文字与旧 slug 输入分离，不改变正文编译 ID。历史目录显示契约变化时更新 `build-history.js` 的专属 `toc-text-N` 编译版本，让 generation 失效，无需更改 JSON schema。
  - **作者写法**：`[[文件名#3.3 Softmax 回归]]` / `[[#章节标题]]` 使用源标题，不要求手写网页 slug。prepare 保存 Markdown 标题语义，在块/标题 ID 完成后绑定实际 ID；链接与校验共用 resolvedAnchor。不改变现有 ID 算法，尤其不能从 KaTeX 最终子树反推源标题。
  - **两阶段发布**：prepare 保留转换后的内容树和 VFile；全站可见索引齐备后 resolveMDLinks 修改明确关联的 wiki 节点并收集普通 URL；校验通过才 renderPreparedMD 和写出。使用 unified 的非字符串 compiler 结果保留 HAST，序列化不会重跑 Shiki/KaTeX。metadata 临时属性必须移除。
  - **历史共享**：content/anchor-index.json 只供构建进程消费，包含源标题/实际 ID/块 ID，见 content-validation.md。历史 wiki（含同文）指向当前正文规范 URL，避免比较视图重写标题 ID 后局部 hash 失效；compilerVersion 和索引 hash 共同使 generation 失效。
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
- **客户端运行时（`src/utils/lazyImages.js`）**：`initLazyLoad()`（vanilla-lazyload@12，`elements_selector:'img.lazy'`、`threshold:200`、`callback_error`→`.error` 类 + ERROR_URI + warn）；`updateLazyLoad()`（dev 内容晚注入/路由切换后重扫）；`setPlaceholderTheme(theme)`（主题切换时仅替换 `src` 精确等于 `PLACEHOLDER_URI`/`PLACEHOLDER_LIGHT_URI` 的占位图，不能用“任意 data URI”判断，否则会把 `ERROR_URI` 恢复成 loading）。失败态保留 `data-src`，在灯箱链接外插入一个 `data-image-retry` 按钮；点击期间禁用按钮并调用 vanilla-lazyload@12 的 `instance.load(el, true)`，成功移除按钮，失败恢复可重试，禁止自动循环和时间戳 query。App.jsx 在 theme 变化时调用。**不要用 `typeof IntersectionObserver` 做 init 守卫**——无 IO 时恰需实例化让库走 `loadAll()` 全量加载降级（用 `typeof window` 仅防 SSR）
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
