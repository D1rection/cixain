# Component Guidelines

> How components are built in this project.

## Component Patterns

- **Functional components only**. No class components.
- Each component is a single `.jsx` file.
- Co-locate CSS Module: `ComponentName.jsx` + `ComponentName.module.css`.

## Styling Patterns

- **CSS Modules** for component-scoped styles.
- **CSS custom properties** (defined in `src/styles/global.css`) for theme values: colors, fonts, spacing.
- No utility-first CSS framework (Tailwind, etc.).
- Theme switching via `[data-theme="dark"]` attribute on `<html>`, with CSS variable overrides.

```css
/* PostCard.module.css — example */
.card {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
}
```

## Data Injection

Components receive page data through `window.__BLOG_DATA__`:

```jsx
// entry-client.jsx — hydration
const data = JSON.parse(document.getElementById('__BLOG_DATA__').textContent)
root.hydrateRoot(
  document.getElementById('root'),
  <BrowserRouter>
    <App initialData={data} />
  </BrowserRouter>
)
```

Pages use a `useBlogData` hook to access their specific slice:

```jsx
function Home() {
  const { posts } = useBlogData()  // only posts metadata
}

function BlogPost() {
  const { post, postContent } = useBlogData()  // single post
}
```

## Interactive Components (react:xxx)

Markdown code blocks marked with `react:ComponentName` are compiled to DOM placeholders at build time. `InteractiveWrapper` mounts real React components at runtime via `createRoot`.

```html
<!-- Build output HTML placeholder -->
<div data-interactive="CodeSandbox" data-code='{"code":"..."}'></div>
```

```jsx
// InteractiveWrapper.jsx — runtime component mounting
useEffect(() => {
  document.querySelectorAll('[data-interactive]').forEach(el => {
    const { component, code } = el.dataset
    mountReactComponent(el, component, JSON.parse(code))
  })
}, [])
```

## Code Copy Button

- **Build-time injection**: `rehypeCopyButton` plugin in `build-posts.js` appends `<button class="copy-btn">复制</button>` to every `<pre>` element.
- **No runtime DOM injection**: Button lives in static HTML from the start. No `useEffect`, no `MutationObserver`.
- **Event delegation**: A single `document` click handler in `main.jsx` handles all `.copy-btn` clicks via `e.target.closest('.copy-btn')`.
- **Visibility**: CSS `opacity: 0 → 1` on `<pre>` hover.
- **Copy**: `navigator.clipboard.writeText(pre.querySelector('code').textContent)`, button shows "已复制" for 1.5s.

## Post End Module (`PostEnd`)

文章页底部统一的「终端窗口」风格模块（上一篇/下一篇 + 相关推荐 + 版权）：

- **数据源**：`useBlogData()` 的 `posts`（已按 date 降序），当前文章经 `meta = posts.find(...) || post` 传入
- **上一篇/下一篇**：`posts.findIndex(p => p.slug === post.slug)` 取相邻索引；`idx < 0` 时导航整体不渲染
- **相关推荐**：共同 tag 数量打分，同分按日期新→旧，取前 3；无共同 tag 或 tags 为空时模块隐藏
- **样式**：窗口标题栏（三色圆点 + `cicada@blog:~`）+ 等宽字体 prompt 行（`$ cat ../prev` 等）+ `→` accent 箭头，圆角 8px 容器，区别于全局硬阴影盒子
- **版权**：文案与 Footer 保持一致（`© 2026 Cicada` + CC BY-NC-SA 4.0 链接）

## ScrollToTop

SPA 客户端导航时滚动位置会保留，需在路由变化时手动回顶：

- **实现**：`ScrollToTop` 组件挂在 App 最外层，`useLayoutEffect`（绘制前执行，避免闪烁）监听 wouter `useLocation()[0]`，pathname 变化时 `window.scrollTo(0, 0)`
- **hash 保护**：`window.location.hash` 存在时跳过（wouter 的 location 不含 hash，必须读 `window.location.hash` 检查）
- **不误触**：搜索打开、主题切换等状态变更不改变 pathname，不会触发
- **已知取舍**：分页 `?page=` 查询串不变 pathname，翻页不滚动回顶

## Accessibility

- Semantic HTML: `<article>`, `<nav>`, `<main>`, `<time>` for blog content.
- Headings hierarchy preserved (h1 → h2 → h3, no skipping).
- Images must have `alt` text.
