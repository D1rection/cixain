# 已确认提交范围

修复提交：`fix(content): 支持 Obsidian 原始标题链接`。所有实现、测试、规范与本任务文档作为一个完整变更。2026-10-01 用户以“好的，归档提交推送吧”确认本清单，授权依次提交修复、归档任务、记录会话，最后统一推送一次；既有未提交修改继续排除。

## 本会话修改

- `.gitignore`
- `.trellis/spec/frontend/content-pipeline.md`
- `.trellis/spec/frontend/content-validation.md`
- `.trellis/tasks/10-01-obsidian-heading-links/check.jsonl`
- `.trellis/tasks/10-01-obsidian-heading-links/design.md`
- `.trellis/tasks/10-01-obsidian-heading-links/implement.jsonl`
- `.trellis/tasks/10-01-obsidian-heading-links/implement.md`
- `.trellis/tasks/10-01-obsidian-heading-links/prd.md`
- `.trellis/tasks/10-01-obsidian-heading-links/research/commit-plan.md`
- `.trellis/tasks/10-01-obsidian-heading-links/research/current-state.md`
- `.trellis/tasks/10-01-obsidian-heading-links/research/verification.md`
- `.trellis/tasks/10-01-obsidian-heading-links/task.json`
- `docs/writing-fragments.md`
- `scripts/build-history.js`
- `scripts/build-posts.js`
- `scripts/lib/content-validation.js`
- `scripts/lib/heading-links.js`
- `tests/content/heading-links.test.mjs`
- `tests/revisions/heading-links.test.mjs`

## 既有未提交修改，不纳入本次提交

- `.obsidian/app.json`
- `.obsidian/community-plugins.json`
- `.obsidian/plugins/ignore/data.json`
- `.obsidian/plugins/update-time-on-edit/data.json`
- `.obsidian/plugins/update-time-on-edit/main.js`
- `.obsidian/plugins/update-time-on-edit/manifest.json`
- `.obsidian/plugins/update-time-on-edit/styles.css`
- `.obsidian/types.json`
- `.obsidian/workspace.json`
- `Templates/callout.md`
- `Templates/new-post.md`
- `content/posts/2026-10-01-001.md`
- `public/feed.xml`
- `public/og/2026-08-26-002.png`
- `public/og/2026-08-27-001.png`
- `public/og/2026-09-03-001.png`
- `public/og/2026-09-04-001.png`
- `public/og/2026-09-04-002.png`
- `public/og/2026-09-05-001.png`
- `public/og/2026-09-06-001.png`
- `public/og/2026-09-07-001.png`
- `public/og/2026-09-23-001.png`
- `public/og/2026-09-27-001.png`
- `public/og/default.png`
- `public/sitemap.xml`

## 验证

18 项内容测试、10 项历史测试、隔离副本完整构建、真实两处链接的浏览器定位及 diff/context 检查通过。没有修改用户正文或覆盖工作区生成文件。
