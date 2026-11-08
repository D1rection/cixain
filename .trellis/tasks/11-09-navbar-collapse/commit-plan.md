# 一次性提交清单（待确认）

## 提议提交

`feat: 导航滚动收起`

包含功能代码、spec 更新和任务记录：

- `src/hooks/useScrolledFromTop.js`（新增）
- `src/components/NavBar.jsx`
- `src/components/NavBar.module.css`
- `src/components/BackToTop.jsx`
- `.trellis/spec/frontend/component-guidelines.md`
- `.trellis/tasks/11-09-navbar-collapse/check.jsonl`
- `.trellis/tasks/11-09-navbar-collapse/commit-plan.md`
- `.trellis/tasks/11-09-navbar-collapse/design.md`
- `.trellis/tasks/11-09-navbar-collapse/implement.jsonl`
- `.trellis/tasks/11-09-navbar-collapse/implement.md`
- `.trellis/tasks/11-09-navbar-collapse/prd.md`
- `.trellis/tasks/11-09-navbar-collapse/task.json`
- `.trellis/tasks/11-09-navbar-collapse/validation.md`

## 已有改动（全部排除，不纳入提交）

- `.obsidian/app.json`
- `.obsidian/community-plugins.json`
- `.obsidian/plugins/ignore/data.json`
- `.obsidian/plugins/update-time-on-edit/*`（删除）
- `.obsidian/workspace.json`
- `.obsidian/types.json`
- `Templates/callout.md`
- `Templates/new-post.md`
- `Templates/paper-reading.md`
- `content/posts/posts.json`
- `content/posts/draft-RACAI.md`
- `public/feed.xml`
- `public/sitemap.xml`
- `public/og/*.png`
- `.trellis/tasks/archive/2026-10/10-05-code-block-consistency/`

说明：验证阶段跑过 `npm run dev` 与 `npm run build`，`content/posts/posts.json`、`public/feed.xml`、`public/sitemap.xml` 可能已被重新生成。这些文件在本次任务开始前就已是未提交状态，且属于部署脚本 `git add content/` 的产物，按原样保留，不动也不暂存。

## 执行范围

仅暂存以上明确文件，创建一次普通提交。不 amend、不强推。分支沿用当前 `main`；推送前单独确认。
