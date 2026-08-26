# Design — 文章更新时间迁移到 frontmatter

## 1. 目标数据流（迁移后）

```
Obsidian 插件保存时写入 frontmatter updated: YYYY-MM-DD
        │
        ▼
scripts/build-posts.js 读取 frontmatter（gray-matter），归一化为北京时间纯日期
        │
        ▼
content/posts/posts.json  "updated": "YYYY-MM-DD" | null
        │
        ▼
src/pages/BlogPost.jsx（不变） 与 date 不同日才显示"更新于"
```

git 提交时间、CI 浅克隆、文件 mtime 从此与 `updated` 完全无关。

## 2. `build-posts.js` 改动

### 2.1 移除 git 依赖

- 删除 `gitCommitDate()` 函数（当前第 648-654 行）及其用途 `spawnSync` / `git` 命令调用。
- 第 688 行 `updated: gitCommitDate(join(postsDir, file))` 改为：

```js
updated: data.updated ? normalizeDate(data.updated) : null,
```

### 2.2 frontmatter 日期归一化（复用现有 parseDate 语义）

gray-matter 会把 YAML 纯日期 `2026-08-26` 解析为 Date（UTC 午夜），带时间字符串则原样保留。与现有 `parseDate()`（第 634-640 行，date 字段用）语义保持一致：

- Date 实例 → `new Date(val.getTime() - 8 * 3600 * 1000)`（YAML 午夜 UTC 转回北京时间）；
- 含 `T`/空格 → 直接 `new Date(val)`（ISO 带时区）；
- 纯日期字符串 → `new Date(val + 'T00:00:00+08:00')`。

再统一输出北京时间日期 `YYYY-MM-DD`（`toLocaleDateString('en-CA')` 依赖进程时区，改为固定 +08:00 计算：`new Date(d.getTime() + 8*3600e3).toISOString().slice(0,10)`），避免 CI（UTC 时区）与本地时区差异导致日期偏移一天。该归一化与 `parseDate` 共用一套约定，可抽为小工具函数（或直接复用 parseDate + 固定时区格式化）。

### 2.3 边界

- frontmatter 无 `updated` → `null`（前端不显示"更新于"，现状兜底行为不变）。
- `updated` 与 `date` 同日 → 前端现有逻辑不显示（`BlogPost.jsx` 第 68 行，不改）。

## 3. 存量回填（一次性）

- 临时 Node 脚本：对每篇 `content/posts/*.md` 执行 `git log -1 --format=%cI -- <file>`（本地全量克隆，值可靠），转北京时间 `YYYY-MM-DD`，在 frontmatter 中插入 `updated: <date>` 行。
- **无 git 提交历史的文件（如未提交的新文章 `2026-08-26-003.md`）跳过**，不写 `updated`（保持 null）。
- frontmatter 已有 `updated` 的文件跳过（幂等）。
- 脚本仅用于本次迁移，跑完不留仓库（一次性操作，避免长期维护面）。
- 回填值预期：08-13 / 08-20 / 08-21 / 08-26 分散分布（现状本地构建值）。
- 回填后产生一次"13 篇 frontmatter 变更"的全量提交（方案 A 已确认接受）。

## 4. 兼容性

- `content/posts/posts.json` 的 `updated` 字段名/格式不变（`"YYYY-MM-DD"` 或 `null`），前端与 `scripts/build-seo.js`（`updated || date` 逻辑）零改动。
- 构建产物 `*.html`、`search-index.json` 不变。

## 5. 验证

- 全量构建后逐篇核对 `posts.json.updated` == frontmatter 值。
- **浅克隆复现验证**：`git clone --depth 1` 后 `npm ci && npm run build`，确认各篇 `updated` 仍分散正确（迁移前此项全为最新提交日，迁移后必须不再出现）。
- dev 模式抽查 2 篇（有/无 updated）确认页面显示无回归。

## 6. 回滚

- 单文件改动（build-posts.js 一处赋值 + 函数删除），git revert 即可。
- 回填的 frontmatter 变更可整体 revert；若已部署，仅影响"更新于"显示，无数据损坏风险。