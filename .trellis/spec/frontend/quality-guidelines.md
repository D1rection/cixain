# Quality Guidelines

> Code quality standards for this project.

## Forbidden Patterns

- **Global CSS class name leakage**: All component styles must use CSS Modules. No bare class names outside `global.css`.
- **Runtime data fetching in production**: Data is injected at build time. No `fetch()` calls for blog content in production.
- **`any` type usage**: (N/A — this project uses plain JSX, not TypeScript)

## Required Patterns

- CSS Modules for all component styles. Import from `.module.css` files.
- Components co-located with their CSS Module.
- `vite dev` for development — do not run `static-renderer.js` in dev mode.
- Semantic HTML for content pages (blog posts, about page).

## Code Review Checklist

- [ ] CSS Modules used instead of global class names?
- [ ] No `fetch` calls for blog data?
- [ ] Component follows directory structure conventions?
- [ ] No placeholder or draft content leaked to production?
- [ ] Semantic HTML elements used for blog content?
