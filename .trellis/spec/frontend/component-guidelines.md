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

### CSS Modules 类名引用教训（防回归）

- **不要用字符串拼接动态访问样式类**：`styles['tag' + tierName]` 会因大小写不匹配静默返回 `undefined`（如 `'tag' + 'hot'` → `'taghot'` ≠ 导出键 `tagHot`），渲染出无效 class。应直接引用 styles 对象：`count >= max / 2 ? styles.tagHot : ''`。
- 多档样式（如热度分档）用三元链/映射表选择具体类，而不是拼字符串（`08-21-sidebar-counts-tags`）。

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
- **系列分流**：文章有 `series` 字段时，上一篇/下一篇替换为系列内相邻篇（prompt 每行 `$ cat series/prev` / `$ cat series/next`，无方向标签），排序规则见 `src/utils/series.js`；相关推荐排除同系列文章（系列内联系已由导航覆盖）。非系列文章维持全局上下篇（`$ cat ../prev` / `../next`）+ 全量推荐
- **相关推荐**：共同 tag 数量打分，同分按日期新→旧，取前 3；无共同 tag 或 tags 为空时模块隐藏
- **分享入口**：窗口最底部（版权块之后）一排圆形品牌色图标按钮（微信/QQ/小红书/知乎，Simple Icons 官方 SVG path，`fill="currentColor"`）。微信/小红书/知乎无公开 web 分享接口 → 点击复制链接（`navigator.clipboard` 写 `window.location.href`），按钮排下方提示「✓ 已复制，去微信/小红书/知乎粘贴」2s 消失；QQ 跳官方 intent（`connect.qq.com/widget/shareqq`）。**全部用 button**（非 `<a href>`）：分享链接需当前页面绝对 URL，SSG 渲染期无 `window`，点击时才取 `window.location.href` 拼参数；`window.open(url, '_blank', 'noopener')`
- **样式**：窗口标题栏（三色圆点 + `cicada@blog:~`）+ 等宽字体 prompt 行（`$ cat ../prev` 等）+ `→` accent 箭头，圆角 8px 容器，区别于全局硬阴影盒子；分享按钮用 `.shareIcon`/`.shareRow`/`.shareHint`（16px 图标、品牌色、无边框，贴合小字号）
- **版权**：文案与 Footer 保持一致（`© 2026 Cicada` + CC BY-NC-SA 4.0 链接）

## NavBar

顶部导航栏，左段品牌打字机标题 + 右段链接（首页/归档/关于）与操作按钮（GitHub/搜索/背景/主题）：

- **宽度策略（有意决策）**：`.inner` **不做 `max-width` 约束**，内容铺满导航条全宽。左段贴容器左缘、右段贴容器右缘（`justify-content: space-between`），两端留白响应式：移动端（≤768px）16px（≤480px 12px）、桌面端（≥769px）32px（Material 桌面 24dp 与常见 24–64px 区间的折中）。大屏下两段之间的中间空隙随视口变宽而变大，属预期行为。
- **防回归教训**：曾用 `max-width: 1200px` + `margin: 0 auto` 让内容居中，导致导航条背景满宽而内容悬于中部——≥1200px 视口下两端各露出 120px+（1920px 时 360px+）空导航条背景。**不要为了压缩中间空隙而恢复宽度约束**（`08-21-navbar-edge-gap`）。
- **断点**：≤768px 折叠为汉堡按钮 + 全宽图标菜单（`.linkText` 隐藏、`.link` 变 32px 图标方块、`.actions` 用 `display: contents` 并入菜单行）；≤480px 时 `.inner` padding 收窄为 12px。
- **品牌打字机**：`TEXTS` 循环打字/删除（`Cicada's blog` ↔ `cixain`），宽度动态变化不影响右段贴边。SSG 与客户端初始状态必须同时渲染完整的第一段文案，首屏停留后再从删除阶段进入循环；不要用空字符串作为初始值，否则弱网或主线程繁忙时首帧只剩光标。递归动画每次只保留一个当前 timer，并在 effect cleanup 中清理。
- **背景切换**：`handleBgToggle` 用 fixed overlay 遮罩 + 预加载图片后切换 `--bg-image`，避免新背景闪现。
- **图片预览**：预览覆盖层不写入浏览器 history；监听真实 `popstate` 仅用于在用户后退时关闭覆盖层，避免打开/关闭预览产生伪页面记录。

## ScrollToTop

SPA 客户端导航时滚动位置会保留，需在路由变化时手动回顶：

- **实现**：`ScrollToTop` 组件挂在 App 最外层，`useLayoutEffect`（绘制前执行，避免闪烁）监听 wouter `useLocation()[0]`，pathname 变化时 `window.scrollTo(0, 0)`
- **hash 保护**：`window.location.hash` 存在时跳过（wouter 的 location 不含 hash，必须读 `window.location.hash` 检查）
- **不误触**：搜索打开、主题切换等状态变更不改变 pathname，不会触发
- **已知取舍**：分页 `?page=` 查询串不变 pathname，翻页不滚动回顶

筛选列表（分类/标签/系列）分页必须从 `useSearch()` 读取 `page`，对过滤结果切片，并把当前筛选路径作为 `Pagination` 的 `base`；禁止回退到首页根路径。

## Accessibility

- Semantic HTML: `<article>`, `<nav>`, `<main>`, `<time>` for blog content.
- Headings hierarchy preserved (h1 → h2 → h3, no skipping).
- Images must have `alt` text.
