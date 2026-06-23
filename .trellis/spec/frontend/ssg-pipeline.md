# SSG Pipeline

> How static pages are generated at build time.

## Build Script: `scripts/static-renderer.js`

Uses Vite's `ssrLoadModule` to load React components in Node, then `renderToString` to produce static HTML.

### Workflow

1. `vite build` — produce `dist/index.html` (template) + JS/CSS assets
2. `node scripts/static-renderer.js` — for each route:
   - Read route-specific data (`posts.json`, article HTML, etc.)
   - `vite.ssrLoadModule('/src/entry-server.jsx')` — load React tree
   - `renderToString(<StaticRouter><App data={...} /></StaticRouter>)`
   - Inject rendered HTML into template (`<!--ssr-outlet-->`)
   - Embed page data as `<script id="__BLOG_DATA__">` per route
   - Write `dist/[path]/index.html`

### Routes Generated

| Route | Data | Output |
|-------|------|--------|
| `/` | `posts.json` (all metadata) | `dist/index.html` |
| `/blog/:slug` | single post metadata + HTML + interactive data | `dist/blog/[slug]/index.html` |
| `/about` | `about.html` | `dist/about/index.html` |
| 404 fallback | empty blog data (layout only) | `dist/404.html` |

### Dev Mode

- Pure SPA via `vite dev`. No SSG in development.
- Changes to content auto-trigger HMR via Vite plugin.
