# SPA 客户端导航内容不更新

## Goal

修复客户端导航（不刷新页面）时，文章页显示的还是上一篇内容的 bug。

## 问题

1. 打开文章 A → 正常显示
2. 点链接到文章 B → URL 变了，但内容还是文章 A
3. 刷新页面才显示文章 B

## 根因（调研总结）

- `__BLOG_DATA__` context 在客户端导航时不更新，`post` 和 `postContent` 始终是首次加载页面的数据
- `BlogPost.jsx` 第 19 行 `meta = post || ...` 永远走 `post`（旧数据），忽略了 slug 变化
- 第 20 行 `html = postContent || ...` 也走旧数据
- 第 23 行 fetch effect 因 `postContent` 不为空而提前 return，不再拉新内容

## 业界方案（适用于 wouter + SSG 场景）

1. **组件 key 重建**：`<Route path="/blog/:slug">{p => <BlogPost key={p.slug} />}</Route>` — 每次 slug 变化重建组件，重置所有本地状态
2. **slug 驱动数据**：`meta` 永远通过 `posts.find(p => p.slug === slug)` 推导，不依赖 context 的 `post`
3. **html 条件使用**：`postContent` 只在 `slug === post?.slug` 时用，否则走 fetch
4. **effect 依赖 fetch**：fetch effect 依赖 `[slug]`，条件只判断 slug 是否匹配，不因内容存在而跳过

## 涉及文件

- `src/App.jsx` — Route 加 key
- `src/pages/BlogPost.jsx` — meta/html/effect 修复

## 验收标准

- [ ] 文章 A → 文章 B 客户端导航，内容正确显示为文章 B
- [ ] 文章 B → 文章 A，内容正确
- [ ] 刷新页面后仍能正常显示（SSG 数据不受影响）
- [ ] 文章未找到时显示 404
