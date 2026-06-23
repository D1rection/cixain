# Frontend Development Guidelines

> Personal blog — static site generated via Vite SSR build pipeline.

## Overview

This is a frontend-only SSG (Static Site Generation) blog project. Content is written in Markdown, compiled to HTML at build time, and pre-rendered into static pages via `react-router` StaticRouter + `renderToString`. No runtime server.

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Project layout and file organization | Filled |
| [Component Guidelines](./component-guidelines.md) | Component patterns, CSS Modules, data injection | Filled |
| [Hook Guidelines](./hook-guidelines.md) | Custom hook conventions | Filled |
| [Content Pipeline](./content-pipeline.md) | Markdown → HTML processing | Filled |
| [SSG Pipeline](./ssg-pipeline.md) | Static site generation build process | Filled |
| [Git Conventions](./git-conventions.md) | Commit message standards | Filled |
| [Quality Guidelines](./quality-guidelines.md) | Code standards and patterns | Filled |

## Architecture Constraints

- **SSG only**: All pages are pre-rendered at build time. No Node.js server at runtime.
- **Data injection**: Page data flows through `window.__BLOG_DATA__` (embedded in HTML at build time), not API calls.
- **Dev mode**: Runs as SPA via `vite dev`. No pre-rendering in development.
- **Content pipeline**: Markdown → unified/remark/rehype → HTML, run by `build-posts.js`.
