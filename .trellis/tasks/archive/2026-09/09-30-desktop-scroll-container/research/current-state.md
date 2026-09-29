# 现状审计（2026-09-30）

本轮仅阅读源码与历史方案，没有运行浏览器或构建。

| 证据 | 当前行为 |
|---|---|
| src/App.jsx:59 | Navbar 已与 ScrollContainer 并列，结构无须重复拆分 |
| src/styles/global.css:85 | html/body/root 的限制仅移动端生效 |
| src/components/ScrollContainer.module.css:8 | overflow-y:auto 仅移动端生效 |
| src/components/ScrollContainer.jsx:32 | 移动用容器，桌面用 window；锁支持两种目标 |
| src/hooks/useTocScroll.js | 支持容器坐标、钳制、尺寸变化校正、用户中断 |
| src/pages/BlogPost.jsx:28；src/hooks/useHeadingAnchors.js:32 | 标题注入 60px 顶部留白，两条路径需一致 |
| src/components/TableOfContents.jsx | 高亮距离以导航高度为参照 |
| src/components/TableOfContents.module.css | ≥1200px 时目录 fixed top:80px，自身滚动 |
| src/hooks/useHashScroll.js | scrollIntoView 居中，需要验证外壳是否被推动 |
| src/components/ReadingProgress.module.css | fixed 顶部层级低于 navbar，须区分已有可见性与迁移回归 |

历史依据：.trellis/tasks/archive/2026-09/09-19-navbar-outside-scroll-container/design.md 明确保留桌面 window 滚动。

工作区已有大量非本任务内容/Obsidian/生成物改动；本轮仅创建本任务文件。
Trellis workflow 提及 trellis-brainstorm，但项目 .agents/skills 不存在，项目及已知用户技能目录未找到该指引；本轮直接按 workflow 的 planning 文档契约产出方案。
