# SSG Pipeline

> How static pages are generated at build time.

## Build Script: `scripts/static-renderer.js`

Uses Vite's `ssrLoadModule` to load React components in Node, then `renderToString` to produce static HTML.

### Workflow

1. `vite build` — produce `dist/index.html` (template) + JS/CSS assets
2. `node scripts/static-renderer.js` — for each route:
   - Read route-specific data (`posts.json`, article HTML, etc.)
   - `vite.ssrLoadModule('/src/entry-server.jsx')` — load React tree
   - `renderToString(<StaticRouter><App data={...} /></StaticRouter>)`
   - Inject rendered HTML into template (`<!--ssr-outlet-->`)
   - Embed page data as `<script id="__BLOG_DATA__">` per route
   - Write `dist/[path]/index.html`

### Page-Level Data Distribution

页面数据采用**页面粒度分发**，禁止把全站文章正文内联进每个页面（首屏 2MB 问题的根因）：

- `posts.json` 是纯元数据（slug/title/date/...），不含 `postContent`
- 列表类页面（首页/分页/分类/标签/归档/关于）：`__BLOG_DATA__.posts` 仅元数据，无正文
- 文章页：`__BLOG_DATA__.post`（含自身 `postContent`）参与 SSR 水合；`posts` 列表仅元数据
- 文章正文随构建复制到 `dist/content/posts/*.html`，SPA 跳转时由 `BlogPost` fetch 回退按需拉取（与 dev 路径一致）
- 客户端取正文顺序：`post` 字段（SSG 文章页）→ `posts.find()`（元数据）→ fetch 回退（列表页跳转 / dev）
- `metaOnly()` 辅助函数在 `static-renderer.js` 中剥离 `postContent`；复制用 `cpSync` + filter 时注意：filter 会作用于源根目录本身，须按「目录放行 + 文件按后缀过滤」判断，否则整棵子树被静默跳过

### Routes Generated

| Route | Data | Output |
|-------|------|--------|
| `/` | `posts.json` (all metadata) | `dist/index.html` |
| `/blog/:slug` | single post metadata + HTML + interactive data | `dist/blog/[slug]/index.html` |
| `/about` | `about.html` | `dist/about/index.html` |
| `/archive` | `posts.json` (all metadata) | `dist/archive/index.html` |
| 404 fallback | empty blog data (layout only) | `dist/404.html` |

> 分类路由（`/category/<slug>`）与 sitemap 分类列表由 `src/config.js` 的 `SITE.categories` 动态生成（scripts 直接 import，纯 ESM 无 JSX）；`feed.xml` 过滤 `SITE.homeExcludedCategories`（题解不进 RSS）。隐藏分类的文章仍在 `__BLOG_DATA__.posts`（侧边栏计数需要），可见性过滤发生在渲染层（Home/Sidebar）

> 分页走 `/?page=N` 查询参数（Home 先过滤后切片），**无 `/page/N` 路由**：SSG 不生成、sitemap 不收录（勿再加回）

### Code Blocks

Syntax highlighting via `@shikijs/rehype` with `everforest-dark` theme for both light/dark modes.

Line numbers are generated via a custom transformer — each `<span class="line">` gets a `data-line` attribute, and CSS `::before` pseudo-element displays it. Hidden on mobile (`<768px`).

### Images

Post images are wrapped in `<a data-fslightbox>` at build time via a rehype plugin (`rehypeImageLightbox`):
- Groups images by post slug for lightbox swipe navigation
- FSLightbox (`import 'fslightbox'` in `main.jsx`) handles click-to-preview
- MutationObserver auto-detects new images during SPA navigation

### Build Script: `scripts/build-seo.js`

Generates SEO files in both `dist/` and `public/`:

- **`sitemap.xml`** — standard sitemap with all routes (home, posts, categories, tags, about)
- **`feed.xml`** — Atom 1.0 feed with full post HTML content

#### Feed Generation Rules

| Rule | Detail |
|------|--------|
| Format | Atom 1.0 (`<feed xmlns="http://www.w3.org/2005/Atom">`) |
| Content encoding | `type="html"` with XML-entity-escaped HTML (no CDATA) via `escapeXml()` |
| **Content strategy** | **混合（`FEED_FULL = 3`）**：最近 3 篇输出全文 `<content>`，更早文章仅 `<summary>`（`description` 元数据），控制 feed 体积（gzip ≈ 67KB @ 12 篇） |
| **Thumbnail** | 每条 `<media:content url medium="image"/>`：cover 优先（归一绝对 URL），否则 `og/{slug}.png` |
| **Updated** | `<updated>` 用 `p.updated || p.date`（git 更新日期），非发布日期——订阅器才能检测文章更新 |
| Post filter | Excludes `draft: true` posts; excludes `SITE.homeExcludedCategories`（题解隐藏分类不进 RSS） |
| Sort order | By `date` descending |
| Limit | 20 most recent entries |
| Categories | One `<category term="..."/>` per tag |
| URLs | Encoded via `encodeURI()` (spaces → `%20` etc.) |
| Namespace | `xmlns:media="http://search.yahoo.com/mrss/"` 声明于 `<feed>` 根 |

#### Discoverability

- `index.html` and all SSG output pages include `<link rel="alternate" type="application/atom+xml">` in `<head>` for auto-discovery
- Footer has RSS SVG icon linking to `/feed.xml`

### Dev Mode

- Pure SPA via `vite dev`. No SSG in development.
- Changes to content auto-trigger HMR via Vite plugin.
- SEO files (`sitemap.xml`, `feed.xml`) are written to `public/` so available in dev mode.
