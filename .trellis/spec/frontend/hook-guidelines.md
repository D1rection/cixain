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

- **`useHeadingAnchors(html)`** — prefers IDs assigned to compiled `h2`–`h6` elements and uses those same IDs for the TOC; the slug helper remains the fallback for legacy HTML. Fold headings are rendered as `div` and stay outside the TOC.

## Data Fetching

- **页面级数据注入**：当前页数据（元数据列表、当前文章正文）随构建注入 `window.__BLOG_DATA__`；全站正文不内联。
- **运行时 fetch 范围**：允许按需请求构建生成的同源文章/碎片正文、搜索索引及版本比较 JSON；禁止新增运行时后端或获取全站正文。碎片正文加载按 `slug` 隔离状态，使用 AbortController，支持 BASE_URL 和明确失败重试；SSG 内联正文优先。
- **文章版本比较**：`useArticleRevisions` 只在 URL 含合法 `compare` 版本时请求同源构建产物；请求必须按 `slug + generation + revision` 校验，使用 `AbortController` 隔离快速切换，失败时保留最新版正文。版本索引和比较正文不得注入列表页。
- The content pipeline runs server-side in build scripts, not in the browser.

## Naming Conventions

- `use*` prefix for all hooks.
- One hook per file, file named after the hook (`useBlogData.js`).
