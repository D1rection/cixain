# Markdown 热更新插件

## 目标

Vite 插件：监听 content/ 下 .md 文件变更，自动重跑 build-posts.js --dev，触发浏览器 HMR 刷新。

## 具体内容

1. `plugins/vite-plugin-content.js` — Vite 插件：
   - 通过 server.watcher（chokidar）监听 content/**/*.md
   - 变更时执行 node scripts/build-posts.js --dev
   - 发送 `server.ws.send({ type: 'full-reload' })` 刷新浏览器

## 验收标准

- [ ] npm run dev 启动后，修改 Markdown 文件自动触发 build-posts
- [ ] 浏览器自动刷新，显示更新后的内容
- [ ] 新建/删除 Markdown 文件也触发刷新

## 不包含

- 增量构建（每次全量跑一遍即可）
