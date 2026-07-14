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

### Code Blocks

Syntax highlighting via `@shikijs/rehype` with `github-dark` theme for both light/dark modes.

Line numbers are generated via a custom transformer — each `<span class="line">` gets a `data-line` attribute, and CSS `::before` pseudo-element displays it. Hidden on mobile (`<768px`).

### Build Script: `scripts/build-seo.js`

Generates SEO files in both `dist/` and `public/`:

- **`sitemap.xml`** — standard sitemap with all routes (home, posts, categories, tags, about)
- **`feed.xml`** — Atom 1.0 feed with full post HTML content

#### Feed Generation Rules

| Rule | Detail |
|------|--------|
| Format | Atom 1.0 (`<feed xmlns="http://www.w3.org/2005/Atom">`) |
| Content encoding | `type="html"` with XML-entity-escaped HTML (no CDATA) via `escapeXml()` |
| Post filter | Excludes `draft: true` posts |
| Sort order | By `date` descending |
| Limit | 20 most recent entries |
| Categories | One `<category term="..."/>` per tag |
| URLs | Encoded via `encodeURI()` (spaces → `%20` etc.) |

#### Discoverability

- `index.html` and all SSG output pages include `<link rel="alternate" type="application/atom+xml">` in `<head>` for auto-discovery
- Footer has RSS SVG icon linking to `/feed.xml`

### Dev Mode

- Pure SPA via `vite dev`. No SSG in development.
- Changes to content auto-trigger HMR via Vite plugin.
- SEO files (`sitemap.xml`, `feed.xml`) are written to `public/` so available in dev mode.
