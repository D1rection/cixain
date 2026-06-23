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

- **No runtime data fetching**. All data is injected at build time via `window.__BLOG_DATA__`.
- No `fetch`, no `axios`, no React Query, no SWR.
- The content pipeline runs server-side in build scripts, not in the browser.

## Naming Conventions

- `use*` prefix for all hooks.
- One hook per file, file named after the hook (`useBlogData.js`).
