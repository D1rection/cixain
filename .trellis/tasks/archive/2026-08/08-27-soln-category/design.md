# Soln 题解分类 — Design

## 决策

| 问题 | 决策 |
|------|------|
| 隐藏机制 | 用分类值本身作标记：`category: Soln` 即自动从首页排除。写作零负担，无需新增 frontmatter 字段 |
| 隐藏范围 | 仅首页（/ 与 /page/N）。归档 / 标签 / 搜索 / 相关推荐 **保留**（用户选择「只排除首页」） |
| RSS / SEO | feed.xml 排除题解；sitemap / IndexNow / 百度推送保留（用户选择「排除 RSS，保留收录」） |
| 配置源 | `src/config.js` 为唯一配置源，前端与构建脚本均从此读取（消除 static-renderer.js / build-seo.js 的 `['Tech','Life']` 硬编码） |

## 数据流与改动面

数据流不变：`build-posts.js` 产出 `posts.json`（含 `category: "Soln"`）→ 各消费方过滤。

### 1. `src/config.js`（新增唯一配置源）

```js
categories: [
  ['全部', null],
  ['技术', 'Tech'],
  ['随笔', 'Life'],
  ['题解', 'Soln'],           // 新增
],
// 首页列表排除的分类（题解只从 /category/Soln 进入）
homeExcludedCategories: ['Soln'],
```

### 2. 前端（2 处过滤，均引用配置）

- `src/pages/Home.jsx`：过滤链最前加 `if (SITE.homeExcludedCategories.includes(p.category)) return false`（`?category=` 语义自然一致：Soln 被排除 → 空列表）
- `src/components/Sidebar.jsx`：分类区块只渲染 `SITE.categories`（无「全部」项，`['全部', null]` 已从 config 移除，回首页靠左上 logo）；分类计数走 `catCounts`（SITE.categories 驱动，自动生效）

不改动：`FilteredList.jsx`（分类页不过滤；/category/Soln 经 SITE.categories label 查表自动显示「题解」）、`Archive.jsx`、`PostEnd.jsx`、`SearchOverlay.jsx`、`build-search-index.js`（搜索索引保留题解）。

### 3. 构建脚本

- `scripts/static-renderer.js`：从 `../src/config.js` import `SITE`，分类路由 `['Tech', 'Life'].map(...)` → `SITE.categories.filter(([, slug]) => slug).map(([, slug]) => ...)`。config.js 为纯 JS（无 JSX），Node 直接 import 无碍（build-posts.js 已有 import src 先例：`placeholderUri.js`）
- `scripts/build-seo.js`：分类 sitemap 同样改为 config 驱动；feed 生成处 `.filter(p => !p.draft)` 追加 `.filter(p => !SITE.homeExcludedCategories.includes(p.category))`；sitemap 文章 / IndexNow / 百度推送 **不过滤**

### 4. `Templates/problem-post.md`

`category: Tech` → `category: Soln`，注释说明「题解分类不出现在首页，从分类页进入」。

## 验证路径

- dev：`npm run dev`，造 1 篇 `category: Soln` + `draft: true` 文章 → 首页不可见、`/category/Soln` 可见、归档可见
- 生产：`npm run build`（含 ssg/seo/search）→ 检查 `dist/feed.xml` 无题解、`dist/sitemap.xml` 含 `/category/Soln`
- 验收后删除临时草稿

## 回滚

纯增量配置 + 过滤，无迁移；回滚 = 撤销 config 条目与过滤行。现有 12 篇文章零影响。