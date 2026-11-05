# 一次性提交清单（用户已确认）

## 提议提交

`feat(blog): 支持递归子文章与顶部折叠列表`

包含本功能代码、测试、说明、新模板、spec 和任务设计/验证记录：

- `.trellis/spec/frontend/component-guidelines.md`
- `.trellis/spec/frontend/content-pipeline.md`
- `.trellis/spec/frontend/content-validation.md`
- `.trellis/spec/frontend/index.md`
- `.trellis/spec/frontend/post-hierarchy.md`
- `.trellis/spec/frontend/ssg-pipeline.md`
- `.trellis/tasks/11-05-article-hierarchy/check.jsonl`
- `.trellis/tasks/11-05-article-hierarchy/commit-plan.md`
- `.trellis/tasks/11-05-article-hierarchy/design.md`
- `.trellis/tasks/11-05-article-hierarchy/implement.jsonl`
- `.trellis/tasks/11-05-article-hierarchy/implement.md`
- `.trellis/tasks/11-05-article-hierarchy/prd.md`
- `.trellis/tasks/11-05-article-hierarchy/research/codebase.md`
- `.trellis/tasks/11-05-article-hierarchy/task.json`
- `.trellis/tasks/11-05-article-hierarchy/validation.md`
- `Templates/new-child-post.md`
- `docs/writing-child-articles.md`
- `scripts/build-posts.js`
- `scripts/build-search-index.js`
- `scripts/build-seo.js`
- `scripts/generate-og.js`
- `scripts/lib/post-hierarchy.js`
- `scripts/static-renderer.js`
- `src/components/ChildArticles.jsx`
- `src/components/ChildArticles.module.css`
- `src/components/PostEnd.jsx`
- `src/components/SearchResultsList.jsx`
- `src/components/TagChip.jsx`
- `src/components/TagChip.module.css`
- `src/pages/Archive.jsx`
- `src/pages/BlogPost.jsx`
- `src/pages/BlogPost.module.css`
- `src/pages/Browse.jsx`
- `src/pages/FilteredList.jsx`
- `src/pages/Home.jsx`
- `src/utils/postHierarchy.js`
- `src/utils/series.js`
- `src/utils/taxonomy.js`
- `tests/content/post-hierarchy.test.mjs`

## 已有改动（全部排除，不纳入提交）

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
- `content/posts/posts.json`
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
- `public/og/2026-10-18-001.png`
- `public/og/2026-11-05-001.png`
- `public/og/2026-11-05-002.png`

## 执行范围

用户已于本轮明确授权“提交并推送”。仅暂存以上明确文件并创建一次普通提交，再正常推送当前 main 分支到 origin，不 amend、不强制推送。任务归档和 journal 不是本次提交的一部分，可在代码提交后按 finish-work 单独处理。
