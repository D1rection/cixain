# Design: 每页内联全站文章 HTML 瘦身

## 现状数据流

`scripts/static-renderer.js` 构造每个路由的 `data`，经 `render(route.path, data)` SSR 后连同 `JSON.stringify(route.data)` 一起写入 `<script id="__BLOG_DATA__">`：

- **首页/分页/分类/标签**：`posts: posts.map(p => ({...p, postContent}))` —— 全站正文
- **文章页**：`{ post: p, postContent, posts: 全站带正文 }` —— 全站正文 ×2 份
- **about/archive**：`posts`（纯 meta，about 另带 `pageContent`）—— 这两类页面本就没问题
- **404**：`posts: []`

客户端 `BlogPost.jsx` 消费链：`meta = posts.find(p => p.slug === slug) || post`，正文 `meta?.postContent || devHtml`；当 `meta.postContent` 缺失时已有 fetch 回退 `fetch('/content/posts/${slug}.html')`（dev 模式在用，生产缺文件）。

## 数据契约（新）

| 路由 | `__BLOG_DATA__` 内容 |
|------|---------------------|
| `/`、`/page/N`、`/category/*`、`/tag/*` | `{ posts: PostMeta[] }` |
| `/blog/:slug` | `{ post: PostWithContent, posts: PostMeta[] }` |
| `/about` | `{ pageContent, posts: PostMeta[] }`（不变） |
| `/archive` | `{ posts: PostMeta[] }`（不变） |
| `/404` | `{ posts: [] }`（不变） |

- `PostMeta` = `posts.json` 条目（slug/title/date/updated/description/category/tags/series/seriesIndex/draft/cover），无 `postContent`
- `PostWithContent` = `PostMeta + postContent`

删掉文章路由的顶层 `postContent` 字段（`grep` 证实 src 内只有 `BlogPost.jsx` 使用它，且走 `meta?.postContent` 而非顶层字段）。

## 按需加载路径

- 客户端：`BlogPost.jsx` 现有 fetch 回退，逻辑不变，仅需数据分发到位
- 生产：构建时把 `content/posts/*.html` 复制到 `dist/content/posts/`（路径与 dev 一致，客户端 fetch 无需改动）；只复制 `.html`，不复制 `posts.json`
- 拷贝放在 `static-renderer.js` 的 `build()` 内（单点构建，不新增脚本）

## 水合一致性（关键边界）

SSG 文章页的 SSR 已渲染全文。若 `posts` 列表中当前文章无 `postContent`，`posts.find()` 会命中元数据 → 客户端认为无正文 → 先空内容再 fetch → **水合错位 + 闪空**。

解法：`BlogPost.jsx` 用 `post` 字段的正文参与水合，一行改动：

```js
const meta = post?.slug === slug ? post : posts.find(p => p.slug === slug) || post
```

- SSG 文章页：`post` 命中（带正文）→ 水合一致，无 fetch
- 列表页（无 `post` 字段）SPA 跳文章：`post?.slug` 不匹配 → `find` 元数据 → fetch 回退 ✓
- dev 模式（无 `post`，posts.json 纯 meta）：行为不变 ✓

## SPA 跳转矩阵（回归范围）

| 跳转 | 数据来源 | 正文 |
|------|---------|------|
| 列表页 → 文章 | 当前页 `posts`（meta） | fetch ✓ |
| 文章 A → 文章 B | A 页 `posts`（B 为 meta） | fetch ✓ |
| 文章 → 列表 | 当前页 `posts`（meta） | 无需 ✓ |
| 系列切换（`sortSeries`） | 仅 meta | 无需 ✓ |
| `/about`（动态 import pages.json） | — | 不变 ✓ |

`postContent` 的消费方仅 `BlogPost.jsx`（已确认）；PostList/Home/PostEnd/TableOfContents 只用元数据。

## 明确不做（本次范围外）

- bundle 分割、背景图 CDN、feed.xml 摘要化、hover 预取/内存缓存（如跳转延迟实测可接受，后续再加）
- 遗留问题（记录不处理）：`dist/feed.xml` 3MB；`dist/` 根部的 UUID 残留文件由 `vite build` 自动清空