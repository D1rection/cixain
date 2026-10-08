# 提交计划

2026-10-09 用户明确授权“归档，提交并推送”。执行一个工作提交，随后分别提交归档和日志，最后统一推送。

`fix(toc): 修复目录标题 HTML 实体显示`

## 包含文件

- `src/utils/headingText.js`
- `src/hooks/useHeadingAnchors.js`
- `scripts/build-history.js`
- `package.json`
- `package-lock.json`
- `tests/content/toc-text.test.mjs`
- `tests/revisions/heading-links.test.mjs`
- `content/posts/posts.json`
- `.trellis/spec/frontend/hook-guidelines.md`
- `.trellis/spec/frontend/content-pipeline.md`
- `.trellis/tasks/10-09-toc-entity-decoding/` 下本任务文档、元数据和原有上下文清单

其中 posts.json 仅更新历史资源 generation、indexUrl 和 comparisonUrl，其他文章元数据不变。

## 未识别的已有改动（全部排除）

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
- `public/og/2026-10-09-001.png`

已获得用户授权。归档与日志分别在工作提交之后提交，然后统一推送；上列无关改动仍全部排除。
