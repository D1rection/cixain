# Hook Guidelines

> How hooks are used in this project.

## Overview

Hooks are minimal in this project — a static blog has limited stateful logic. Custom hooks mainly abstract data access patterns.

## Custom Hook Patterns

- **`useBlogData()`** — generic hook that reads `window.__BLOG_DATA__` and returns the appropriate data slice. Used by all page components.

```jsx
function useBlogData() {
  return useContext(BlogDataContext)
}
```

## Data Fetching

- **页面级数据注入**：当前页数据（元数据列表、当前文章正文）随构建注入 `window.__BLOG_DATA__`；全站正文不内联。
- **仅有的运行时 fetch 例外**：`BlogPost.jsx` 在从列表页 SPA 跳转（正文不在 `__BLOG_DATA__`）时 `fetch('/content/posts/{slug}.html')` 按需拉取，与 dev 模式共用同一条路径。除此之外无其他运行时数据请求。
- The content pipeline runs server-side in build scripts, not in the browser.

## Naming Conventions

- `use*` prefix for all hooks.
- One hook per file, file named after the hook (`useBlogData.js`).
