# Content Pipeline

> How Markdown becomes HTML in this project.

## Build Script: `scripts/build-posts.js`

```
content/posts/*.md
  → gray-matter (frontmatter extraction)
  → unified + remark-parse + remark-math + remark-obsidian-link + remark-image-pipe + remark-rehype + rehype-katex + rehype-shiki + rehype-stringify
  → output:
    content/posts.json         — all articles metadata
    content/posts/[slug].html  — compiled body HTML
    content/pages/about.html   — static pages
```

### Processing Rules

- **Frontmatter required fields**: `title`, `date`, `description`
- **Optional fields**: `category`, `tags`, `draft`, `cover`
- **Draft handling**: Draft articles (`draft: true`) are excluded in production builds but included in dev
- **Future dates**: Articles with future `date` are filtered out
- **Slug**: Derived from filename (strip `.md`)
- **Sorting**: Articles ordered by `date` descending
- **Line breaks**: `remark-breaks` converts single newlines to `<br>` (matching Obsidian behavior).
- **Code highlighting**: shiki with `github-dark` theme
- **Highlight**: `==text==` via custom `remarkHighlight` plugin → `<mark>text</mark>`. Skips `inlineCode` nodes.
- **Math rendering**: KaTeX via `remark-math` + `rehype-katex` (strict: false). Supports `$...$` inline and `$$...$$` display math. Font CSS imported globally via `katex/dist/katex.min.css`.
- **Image positioning**: via custom `remarkImagePipe` plugin. Alt text `left`/`right`/`center` sets position. Pipe suffix `|400` sets width. Examples:
  - `![left](url)` / `![right](url)` — float, no alt text
  - `![left|400](url)` — float + 400px width
  - `![|300](url)` — center + 300px width
  - `![](url)` / `![alt](url)` — center, alt text preserved
  - CSS classes: `img-center` (block, centered), `img-left` (block, left-aligned), `img-right` (block, right-aligned)
- **react:xxx**: Code blocks tagged with `react:ComponentName` are extracted into `interactive` metadata and replaced with `data-interactive` DOM placeholders in the HTML output

### Dev vs Production

| Mode | Content rebuild | Draft included |
|------|----------------|---------------|
| Dev (`--dev` flag) | On file change via Vite plugin + HMR | Yes |
| Production | One-time at build start | No |
