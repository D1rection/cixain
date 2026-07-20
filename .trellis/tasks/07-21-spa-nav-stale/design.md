# SPA 导航数据修复设计

## 改1：App.jsx — Route 加 key

```jsx
<Route path="/blog/:slug">
  {params => <BlogPost key={params.slug} />}
</Route>
```

当 slug 变化时，BlogPost 组件完全卸载并重建，所有本地状态（`devHtml`、scroll position 等）自动重置。

## 改2：BlogPost.jsx — meta 推导

```js
// 之前（错误）：
const meta = post || posts.find(p => p.slug === slug)
// post 来自 context，客户端导航不更新，永远是旧数据

// 之后（正确）：
const meta = posts.find(p => p.slug === slug) || post
// 始终用当前 slug 从全量 posts 数组里找
```

## 改3：BlogPost.jsx — html 推导

```js
// 之前：
const html = postContent || meta?.postContent || devHtml
// postContent 是 context 旧数据，永远优先

// 之后：
const html = (slug === post?.slug && postContent) || devHtml
// 只当 slug 匹配时才用 context 的 postContent
```

## 改4：BlogPost.jsx — fetch effect

```js
// 之前：
useEffect(() => {
  if (postContent || meta?.postContent) return
  if (!meta) return
  fetch(`/content/posts/${slug}.html`)
    .then(r => r.ok ? r.text() : Promise.reject())
    .then(setDevHtml)
    .catch(() => {})
}, [slug])

// 之后（简化 + 修复）：
useEffect(() => {
  if (!slug || !meta) return
  if (slug === post?.slug && postContent) return  // SSG 已有数据
  fetch(`/content/posts/${slug}.html`)
    .then(r => r.ok ? r.text() : Promise.reject())
    .then(setDevHtml)
    .catch(() => {})
}, [slug])
```

## 数据流

```
首次加载（SSG）：
  meta = posts.find(slug)  → 找到文章元数据
  html = postContent        → slug 匹配，用 SSG 注入的 HTML
  effect → slug === post.slug → skip，不 fetch

客户端导航：
  meta = posts.find(newSlug) → 找到新文章元数据
  html = devHtml (null)      → slug 不匹配，暂空
  effect → slug !== post.slug → fetch `/content/posts/newSlug.html`
  setDevHtml(html)           → 重新渲染正文
```
