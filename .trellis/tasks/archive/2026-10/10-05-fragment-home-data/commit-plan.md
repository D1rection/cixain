# 提交计划（已授权）

## 拟提交

`fix(ssg): 修复碎片返回首页文章列表为空`

单次提交包含一处构建修复、SSG 契约以及本任务规划和验收证据：

- `scripts/static-renderer.js`
- `.trellis/spec/frontend/ssg-pipeline.md`
- `.trellis/tasks/10-05-fragment-home-data/check.jsonl`
- `.trellis/tasks/10-05-fragment-home-data/design.md`
- `.trellis/tasks/10-05-fragment-home-data/implement.jsonl`
- `.trellis/tasks/10-05-fragment-home-data/implement.md`
- `.trellis/tasks/10-05-fragment-home-data/prd.md`
- `.trellis/tasks/10-05-fragment-home-data/research/fragment-home-empty.jpg`
- `.trellis/tasks/10-05-fragment-home-data/research/fragment-home-fixed-desktop.jpg`
- `.trellis/tasks/10-05-fragment-home-data/research/fragment-home-fixed-mobile.jpg`
- `.trellis/tasks/10-05-fragment-home-data/research/fragment-navigation.md`
- `.trellis/tasks/10-05-fragment-home-data/research/validation.md`
- `.trellis/tasks/10-05-fragment-home-data/task.json`
- `.trellis/tasks/10-05-fragment-home-data/commit-plan.md`

## 既存改动（全部排除）

以下文件或目录在本任务开始前已存在改动，不加入提交：

- `.obsidian/app.json`
- `.obsidian/community-plugins.json`
- `.obsidian/plugins/ignore/data.json`
- `.obsidian/plugins/update-time-on-edit/data.json`
- `.obsidian/plugins/update-time-on-edit/main.js`
- `.obsidian/plugins/update-time-on-edit/manifest.json`
- `.obsidian/plugins/update-time-on-edit/styles.css`
- `.obsidian/workspace.json`
- `Templates/callout.md`
- `Templates/new-post.md`
- `public/feed.xml`
- `public/og/2026-08-26-002.png`
- `public/og/default.png`
- `public/sitemap.xml`
- `.obsidian/types.json`
- `.trellis/tasks/archive/2026-10/10-05-code-block-consistency/`
- `public/og/2026-08-27-001.png`
- `public/og/2026-09-03-001.png`
- `public/og/2026-09-04-001.png`
- `public/og/2026-09-04-002.png`
- `public/og/2026-09-05-001.png`
- `public/og/2026-09-06-001.png`
- `public/og/2026-09-07-001.png`
- `public/og/2026-09-23-001.png`
- `public/og/2026-09-27-001.png`
- `public/og/2026-10-01-001.png`
- `public/og/2026-10-02-001.png`
- `public/og/2026-10-05-001.png`
- `public/og/2026-10-05-002.png`

## 流程依据

`.trellis/workflow.md` 的 Phase 3.4 要求 “Present the plan once, ask for one-shot confirmation”。2026-10-05 用户明确授权“归档、提交和推送”；提交修复、归档和 journal 后统一推送一次，不 amend。任务归档与 journal 属于后续收尾步骤，不混入当前提交。
