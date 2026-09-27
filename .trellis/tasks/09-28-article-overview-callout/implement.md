# 实施计划

1. 在 `Templates/callout.md` 添加 `[!overview] 总览` 示例。
2. 在 `scripts/build-posts.js` 将 `overview` 映射到 `route` 图标；保留已有 callout 解析流程。
3. 在 `src/styles/global.css` 为浅色与深色主题增加专属总览强调色。
4. 在 `src/components/PostContent.module.css` 增加醒目横幅样式：主题色淡染底、强调边缘、加大标题层级与硬阴影；保留正文标准排版。
5. 在 `.trellis/spec/frontend/content-pipeline.md` 记录新类型及写作语法。
6. 用 `compileMD` 的独立 smoke check 确认 HTML 类型、标题和图标输出；运行 Vite build 确认 CSS 模块可构建。避免完整内容构建覆盖工作区里已有的生成文件改动。
