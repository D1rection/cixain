# 提交计划（已确认）

2026-10-07 用户要求提交并归档；按此前默认范围提交实现、测试、规范和任务记录。草稿全文与其它已有修改保留在工作区，不纳入本次提交。

1. `fix(content): 支持保留公式字体的可换行说明`
   - `scripts/build-posts.js`
   - `scripts/lib/heading-links.js`
   - `src/components/PostContent.module.css`
   - `tests/content/mathtext.test.mjs`
   - `.trellis/spec/frontend/content-pipeline.md`
   - `.trellis/spec/frontend/typography.md`
   - `.trellis/tasks/10-06-inline-math-overflow/` 下任务说明、方案、验证与截图；排除仅本机用的 `research/pre-edit-backup.json`。

可选另提交：`docs(posts): 修正核方法草稿的数学说明排版`，文件 `content/posts/draft-ml.md`。这会连同用户原有的整篇未提交正文一起提交，仅在明确选择包含草稿时执行。

不纳入上述代码提交的已有修改：

- `content/posts/draft-ml.md`（除非明确选择同时提交草稿）。
- `.obsidian/` 下已有配置、插件与工作区变化。
- `Templates/callout.md`、`Templates/new-post.md`。
- `content/posts/2026-10-05-001.md`、`content/posts/2026-10-05-002.md`、`content/posts/posts.json`。
- `public/feed.xml`、`public/sitemap.xml` 和 `public/og/` 下已有图片变化。
- `.trellis/tasks/archive/2026-10/10-05-code-block-consistency/`。

提交后归档当前任务并记录会话，不推送或发布。
