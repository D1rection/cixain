# Directory Structure

> How frontend code is organized in this project.

## Directory Layout

```
cixain/
├── content/
│   ├── posts/              ← Markdown source files (flat, slug = filename)
│   │   ├── hello-world.md
│   │   └── posts.json      ← Build output: all articles metadata
│   └── pages/              ← Static pages (about.md, etc.)
├── scripts/
│   ├── build-posts.js      ← Content pipeline: MD → posts.json + HTML
│   └── static-renderer.js  ← SSG: renderToString → dist/[path]/index.html
├── src/
│   ├── components/
│   │   ├── PostList.jsx
│   │   ├── PostCard.jsx
│   │   ├── PostContent.jsx
│   │   ├── TagChip.jsx
│   │   └── InteractiveWrapper.jsx  ← react:xxx component renderer
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── BlogPost.jsx
│   │   └── About.jsx
│   ├── hooks/
│   │   └── useBlogData.js  ← Reads window.__BLOG_DATA__
│   ├── App.jsx
│   ├── entry-client.jsx    ← Browser entry (ReactDOM.hydrateRoot)
│   ├── entry-server.jsx    ← SSR entry (renderToString)
│   └── main.jsx            ← Dev SPA entry (ReactDOM.createRoot)
├── public/
├── vite.config.js
└── package.json
```

## Naming Conventions

- **Components**: PascalCase (`PostCard.jsx`, `InteractiveWrapper.jsx`)
- **Hooks**: camelCase with `use` prefix (`useBlogData.js`)
- **Pages**: PascalCase in `src/pages/` (`Home.jsx`, `BlogPost.jsx`)
- **CSS Modules**: Co-located with component, same name: `PostCard.module.css`
- **Scripts**: kebab-case in `scripts/` (`build-posts.js`, `static-renderer.js`)
- **Content files**: kebab-case slugs (`hello-world.md`)
