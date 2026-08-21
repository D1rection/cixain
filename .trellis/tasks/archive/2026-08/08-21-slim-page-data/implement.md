# Implement: 每页内联全站文章 HTML 瘦身

## 改动清单

### 1. `scripts/static-renderer.js`（核心）

- 新增元数据转换（不可见 `postContent` 字段）：
  ```js
  const metaOnly = p => {
    const { postContent, ...meta } = p
    return meta
  }
  ```
- 列表类路由（`/`、`/page/*`、`/category/*`、`/tag/*`）：`data.posts = posts.map(metaOnly)`
- 文章路由（`/blog/*`）：`data = { post: {...p, postContent}, posts: posts.map(metaOnly) }`（删除顶层 `postContent` 与全站注入）
- `build()` 内、SSR 循环前：复制正文到 dist：
  ```js
  cpSync(join(contentDir, 'posts'), join(distDir, 'content', 'posts'), { recursive: true, filter: f => f.endsWith('.html') })
  ```
  `mkdirSync` 先确保 `dist/content/posts` 存在即可（cpSync recursive 自动建）。
- `getMeta` / `renderJsonLd` 消费的 `route.data.post` 仍然存在（文章路由），无改动。

### 2. `src/pages/BlogPost.jsx`（一行）

```js
const meta = post?.slug === slug ? post : posts.find(p => p.slug === slug) || post
```

## 验证步骤

1. `npm run build`（全链路：posts → og → vite build → ssg → seo → search-index）
2. 体积断言（node 脚本）：
   - `dist/index.html` < 100KB 且 `__BLOG_DATA__` 内无 `postContent`
   - `dist/blog/*/index.html` 各自只含当前 slug 的 `postContent`
   - `dist/content/posts/*.html` 与 `content/posts/` 的 html 一致
   - 首页 gzip 体积 ≤ 30KB
3. `npm run preview` + 浏览器行为验证：
   - 冷加载首页：console 无 hydration mismatch；`__BLOG_DATA__` 传输大幅下降
   - SPA 跳转矩阵：列表 → 文 A → 文 B → 列表 → 系列切换，内容正确
   - 文章页直接刷新（SSR 直出）内容完整
   - 打开搜索、访问 `/feed.xml`、`/sitemap.xml` 正常
4. `npm run dev` 冒烟：首页 + 文章页渲染正常

## 回滚点

- 改动集中在 2 个文件 + 构建产物；`git diff` 清晰，整体 revert 即可
- `BlogPost.jsx` 一行改动对 dev 模式无影响（`post` 为 undefined 时走原路径）

## Review Gate

- 实施后 diff 自查 + `trellis-check`（或本会话 check 环节）→ 通过后进入 Phase 3（spec 更新、提交）
- spec 更新项：`ssg-pipeline.md` 的数据注入描述需改为「页面级数据分发」