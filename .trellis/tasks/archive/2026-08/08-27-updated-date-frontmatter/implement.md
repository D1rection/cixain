# Implement — 文章更新时间迁移到 frontmatter

## 前置

- 任务状态需为 `in_progress`（用户审阅三文档后 `task.py start`）。

## 实施清单（顺序执行）

1. **回填脚本（临时）**
   - 写一次性脚本（本地跑，跑完删除）：遍历 `content/posts/*.md` → `git log -1 --format=%cI -- <file>` → 北京时间 `YYYY-MM-DD` → frontmatter 注入 `updated:` 行；已有 `updated` 或**无 git 历史**的文件跳过。
   - 校验：13 篇中预期约 12 篇获得值（`2026-08-26-003.md` 无历史跳过）；抽查 2 篇 frontmatter 格式正确（保留原字段、YAML 合法）。

2. **修改 `scripts/build-posts.js`**
   - 删除 `gitCommitDate()` 函数（L648-654）。
   - L688 `updated: gitCommitDate(join(postsDir, file))` → `updated: data.updated ? normalizeDate(data.updated) : null`。
   - 新增 `normalizeDate`（复用 `parseDate` 语义 + 固定 +08:00 格式化，见 design.md §2.2）；如 `parseDate` 位置可复用则直接改造复用。

3. **重建并核对**
   - `node scripts/build-posts.js`（或完整 `npm run build` 最后一步核对）。
   - 逐篇核对 `content/posts/posts.json` 的 `updated` 与 frontmatter 一致。

4. **浅克隆回归验证（关键验收）**
   - `git clone --depth 1 file://<repo> /tmp/cixain-shallow` → `npm ci` → `npm run build` → 确认各篇 `updated` 分散正确（≠ 全部等于 HEAD 提交日）。

5. **前端抽查**
   - `npm run dev` 抽查：一篇有 `updated` 且与 date 不同日的文章显示"更新于 <日期>"；一篇无 `updated` 的文章不显示；无 JS 报错。

6. **Review gate**
   - 变更自检：`git status --porcelain` 应仅含 13 篇 md frontmatter + `build-posts.js` + `content/posts/posts.json`（重建产物）。
   - 展示差异摘要（回填值表）请用户确认。

## 质量检查（Phase 2.2 要点）

- 构建脚本无 lint 问题（项目无独立 lint 配置，做 node --check）。
- `parseDate`/`normalizeDate` 语义一致；YAML Date 与字符串两种输入均覆盖。
- 无 git 历史文章 updated 为 null，页面不显示"更新于"。

## 提交（Phase 3.4，待用户确认后）

- 建议单 commit：`feat: 文章更新时间迁移到 frontmatter`
- 含：13 篇 md（回填）、`scripts/build-posts.js`、重建的 `content/posts/posts.json`。
- 提交后提醒用户：Obsidian 安装 "Update time on edit"，frontmatter 字段名 `updated`、格式 `YYYY-MM-DD`；deploy.yml 无需改动。

## 风险与回滚

- 回填全量提交为已知代价（PRD 已确认）。
- 回滚：revert build-posts.js 改动即回旧逻辑；frontmatter 行可批量删除。