# 文章更新时间迁移到 frontmatter

## Goal

博客"更新于"日期改为以文章 frontmatter 的 `updated` 字段为来源（由 Obsidian 编辑时写入），替代当前基于 git 提交时间（`gitCommitDate`）的方案，使线上显示的更新时间与 Obsidian 中一致，并彻底消除 CI 浅克隆/mtime 重置导致的"所有文章更新时间全部刷新"问题。

## 背景事实（已调查确认）

- 现状链路：`scripts/build-posts.js` 的 `gitCommitDate()` 用 `git log -1 --format=%cI -- <md>` 计算 updated → 写入 `content/posts/posts.json` → `src/pages/BlogPost.jsx` 读取显示（与 `date` 同日则不显示）。
- 线上问题根因：`.github/workflows/deploy.yml` 中 `actions/checkout@v4` 默认 `fetch-depth: 1`（浅克隆），git 历史被截断，`git log -1 -- <file>` 对所有文件均返回 HEAD 提交时间 → 线上所有文章"更新于"都变成最新一次提交日期（2026-08-26）。已用 `git clone --depth 1` 复现验证。
- mtime 不可用：CI checkout 会重置文件 mtime（本地正确、线上不可靠），这正是当初弃用 mtime 选 git 时间的原因。
- 前端显示逻辑无需改动：`BlogPost.jsx` 已支持 `meta.updated`，仅依赖 `posts.json` 中该字段的值。
- 现有 frontmatter 字段：`title` / `date` / `description` / `category` / `tags` / `series` / `seriesIndex` / `draft` / `cover` / `source` / `difficulty` / `url`，尚无 `updated`。
- 全部 13 篇文章均无 frontmatter `updated`，迁移时需处理存量数据。

## Requirements

1. 构建时 `posts.json` 的 `updated` 字段**优先取文章 frontmatter 的 `updated`**（纯日期 `YYYY-MM-DD`）。
2. git 提交时间不再作为线上 updated 来源（避免 CI 环境依赖与浅克隆问题）。
3. Obsidian 侧在文章保存时自动写入/更新 frontmatter `updated`（插件方案，用户侧操作）。
4. 存量 13 篇文章的 `updated` 有确定来源（回填策略，待用户确认）。
5. 前端展示行为不变：与 `date` 同日不显示"更新于"；无 `updated` 不显示。

## Acceptance Criteria

- [ ] `npm run build` 后，`content/posts/posts.json` 中每篇文章的 `updated` 与对应 frontmatter 值一致（或按回填策略为固化值）。
- [ ] 全量重跑构建不依赖 git 历史：在浅克隆（`--depth 1`）环境构建，各文章 `updated` 仍正确（不再全部等于最新提交日）。
- [ ] 在 Obsidian 中修改某篇文章 frontmatter `updated` 后重建，仅该篇文章的"更新于"变化。
- [ ] 无 `updated` 的文章页面不显示"更新于"。
- [ ] 新增文章（含 frontmatter `updated`）构建后正常显示"更新于"。
- [ ] 前端页面与现有交互无回归（发布日、分类、标签等显示不变）。

## Out of Scope

- 不改动前端显示逻辑与样式。
- 不迁移/修改文章正文内容。
- 不改变 `date`（发布日）语义与来源。
- 不处理 series 等其它元数据。

## Decisions（已确认）

- 存量文章采用**方案 A：一次性回填固化**。用本地 git 历史计算各篇真实的最后修改日期，写入各篇 frontmatter `updated`；`gitCommitDate` 及 git 时间来源整体移除，deploy.yml 不改。
- 日常维护用 **Obsidian 插件 "Update time on edit"**（用户侧安装；保存时自动写 frontmatter `updated`，插件格式配置为 `YYYY-MM-DD` 纯日期）。回填由构建侧一次性脚本完成，不由插件负责。