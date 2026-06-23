# 初始化 Vite + React 项目骨架

## 目标

创建博客项目的基础目录结构和开发环境。

## 具体步骤

1. `npm create vite@latest` 创建 React 项目（JSX，非 TypeScript）
2. 安装 `react-router-dom`
3. 按 spec 中 `directory-structure.md` 建立目录结构
4. 配置 vite.config.js（路径别名 `@/` 指向 `src/`，CSS Modules 开箱支持）
5. 配置 dev/build scripts
6. 创建 `src/entry-client.jsx`（BrowserRouter + hydrateRoot）
7. 创建 `src/main.jsx`（dev SPA 入口：createRoot + BrowserRouter）
8. 创建 `src/App.jsx` 基本路由结构
9. 创建三个页面占位组件：`Home.jsx`、`BlogPost.jsx`、`About.jsx`
10. 初始化 `src/styles/global.css`（CSS 变量、reset、字体）

## 验收标准

- [ ] `npm run dev` 正常启动，访问 `localhost:5173` 看到页面
- [ ] 路由 `/`、`/blog/test`、`/about` 可访问，不报 404
- [ ] `src/` 目录结构匹配 spec 中 directory-structure.md
- [ ] CSS Modules 能正常工作
- [ ] `npm run build` 执行成功

## 不包含

- 静态预渲染（static-renderer.js）
- 内容管线（build-posts.js）
- 任何 UI 样式（只需占位文本）
