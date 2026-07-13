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

## Accessibility

- Semantic HTML: `<article>`, `<nav>`, `<main>`, `<time>` for blog content.
- Headings hierarchy preserved (h1 → h2 → h3, no skipping).
- Images must have `alt` text.
