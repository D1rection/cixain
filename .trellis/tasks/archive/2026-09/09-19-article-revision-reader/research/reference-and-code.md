# 参考与仓库核查

日期：2026-09-19。

## 参考

https://pbjorklund.com/articles/show-your-ai-writing-work/

重新读取公开文章确认：Git 提交生成静态资料、去 frontmatter、顶部选择旧提交、默认最新、正文单栏比较、短语级增删、整段增删按块处理；作者描述了真实浏览器验证。
本项目借用阅读体验，不引入 AI 过程披露。AST、缓存、协议、预计算为本项目建议；未审计参考站源码。

## 当前代码

- package.json：React 19/wouter 3/Vite 6/unified；无 lint/typecheck/test scripts。
- build-posts.js 的 compileMD 约 632 行，含 raw HTML/Shiki/KaTeX/Obsidian/图片/interactive。
- HTML 与 posts.json 实际输出 content/posts/，部分 spec 的路径过时。
- BlogPost.jsx：标题后目录，注入正文优先、静态 fetch 回退；切换请求清理需处理。
- useHeadingAnchors.js 正则取标题，不能直接处理混有旧标题文字的 diff。
- parseSegments.js 实例化 react: 片段；历史比较应隔离。
- vite-plugin-content.js 在 Markdown 变化后重建正文/搜索并 full-reload。
- SSG 按页注入，禁止全站正文内联，SPA 可获取静态正文。
- 移动端 useScrollTarget 读取实际滚动容器。
- Actions checkout 未配置 fetch-depth；CI npm run build。
- deploy 先 build，再 add content/、commit、push，CI 推送后重建。
- 2026-08-26-001.md 有 9e35369/a058a0d/182349b 等同日提交及元数据迁移，实际正文差异需过滤验证。

## 规范差异

quality-guidelines 禁止 runtime fetch，与 ssg-pipeline/hooks 已有单篇静态请求例外冲突，实施应同步统一。
部分规范用 react-router 示例，实际为 wouter，不引入另一套路由。

## 工作区

创建任务前有 22 项用户改动，含 Obsidian、模板、文章增删、Feed/sitemap/OG。本轮只写任务目录；后续构建要防止覆盖或误提交这些内容。
