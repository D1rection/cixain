# Quality Guidelines

> Code quality standards for this project.

## Forbidden Patterns

- **Global CSS class name leakage**: All component styles must use CSS Modules. No bare class names outside `global.css`.
- **Runtime data fetching in production**: Page data is injected at build time. Same-origin fetches are allowed only for build-generated static resources that are not needed for the initial page (currently SPA article HTML, search data, and revision comparison JSON); do not add a runtime backend or fetch the whole site dataset.
- **`any` type usage**: (N/A — this project uses plain JSX, not TypeScript)

## Required Patterns

- **Use Context7 for library lookups**: Before configuring or calling any library API (Vite, react-router, unified/remark/rehype, shiki, etc.), use the MCP `context7` tool to query the latest usage docs. Do not rely on training data or outdated examples.
- **JSDoc for component and function docs**: Use JSDoc annotations for component props and non-trivial functions. VS Code provides type hints and parameter completions from JSDoc even without TypeScript.
- CSS Modules for all component styles. Import from `.module.css` files.
- Components co-located with their CSS Module.
- `vite dev` for development — do not run `static-renderer.js` in dev mode.
- Semantic HTML for content pages (blog posts, about page).

## Code Review Checklist

- [ ] CSS Modules used instead of global class names?
- [ ] No runtime backend or whole-site fetch; any same-origin static-resource fetch is scoped, validated, cancellable, and has a latest-content fallback?
- [ ] Component follows directory structure conventions?
- [ ] No placeholder or draft content leaked to production?
- [ ] Semantic HTML elements used for blog content?
- [ ] Historical comparison resources are generated before `vite build`, carry a schema/generation key, and fail closed to the latest article when stale or unavailable?
