# SSG 管线

## 目标

实现 static-renderer.js：Vite SSR 渲染所有路由产出静态 HTML，每个页面嵌入按路由拆分的 __BLOG_DATA__。

## 具体内容

1. 创建 BlogDataContext + useBlogData hook — 所有页面通过此 hook 获取数据
2. 更新 App.jsx / main.jsx — dev SPA 用 import 提供数据
3. 更新 entry-server.jsx — 接收外部 data 参数
4. 更新 entry-client.jsx — 从 window.__BLOG_DATA__ 读取数据
5. 更新页面组件（Home、BlogPost）使用 useBlogData
6. vite.config.js 添加 SSR 配置
7. scripts/static-renderer.js — 核心 SSG 脚本
8. package.json build 脚本 += "&& node scripts/static-renderer.js"

## 验收标准

- [ ] npm run build 产出 dist/index.html（首页，含 posts 数据）
- [ ] dist/blog/hello-world/index.html（文章详情页）
- [ ] dist/about/index.html（关于页）
- [ ] dist/404/index.html（404 页）
- [ ] 每个 HTML 含正确的 __BLOG_DATA__ 脚本
- [ ] 直接打开 HTML 能看到页面内容（SSG 意义）

## 不包含

- react:xxx 组件（保留客户端挂载占位）
- Nginx 配置
