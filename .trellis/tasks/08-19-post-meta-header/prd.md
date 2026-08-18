# 文章头部 meta 信息展示

## Goal

文章内容页头部从"日期 · 分类"扩展为完整 meta 区：新增**更新时间**与**标签**展示，排布遵循业界惯例（标题下方 muted meta 行 + 可点击标签 chip），并顺带将头部内联样式收归 CSS Module（项目规范）。

## Scope（已确认）

- 新增展示：**更新时间**（git 提交时间自动注入）+ **标签**（头部 chip）。
- 不动：阅读时长/字数、系列进度、作者、列表页、SEO schema、callout/引用样式等。
- 涉及文件：`scripts/build-posts.js`（注入 updated）、`src/pages/BlogPost.jsx`（头部 meta 区）、新增 `src/pages/BlogPost.module.css`。

## Requirements

1. `updated` **仅从 git 自动获取**：构建时取该文章 md 文件最后提交时间（`git log -1 --format=%cI -- <file>`）；无提交历史（新文件未提交）→ `null`，不显示。
2. 渲染规则：仅当 `updated` 存在且与发布时间不同日时显示"更新于 &lt;日期&gt;"，避免重复。
3. 头部 meta 区分两层：meta 行（日期 · 更新于 · 分类，muted 小字）+ 标签行（复用 `TagChip`，param="tag"）。
4. 头部样式从内联迁入 `BlogPost.module.css`（遵守 CSS Modules 规范），保持现有视觉基调（muted 小字、节奏栅格）。
5. **桌面与移动端均兼容**：meta 行在桌面单行、移动端自然换行不溢出；标签 chip 两端口碑一致；375px 视口无横向滚动。

## Constraints

- 不引入新依赖（git 调用用 Node `child_process.spawnSync` 标准库）；`posts.json` 结构向后兼容（新增字段不影响现有消费方）。
- 日期格式与现有展示一致（`toLocaleDateString('zh-CN')` 系列）。
- 无 JS 运行时 fetch；SSG 构建链路不变。
- 只对真实数据生效：git 无历史 → 无"更新于"。

## Acceptance Criteria

- [ ] 每篇已提交文章的 `updated` = 该 md 的最后 git 提交日期（实测 10 篇均可得）；未提交新文件 → null。
- [ ] 与发布时间同日 → 不显示"更新于"；不同日 → 显示"更新于 YYYY-MM-DD"。
- [ ] 标签 chip 出现在头部、可点击跳 `/tag/...`，样式与列表页一致。
- [ ] 头部内联 style 已移除，样式全部位于 `BlogPost.module.css`。
- [ ] **移动端 375px**：meta 行/标签行自然换行、无横向溢出、无字重叠；**桌面**：meta 行单行、chip 一排；亮/暗双主题 muted 可读。
- [ ] `npm run build` 通过；posts.json 含 `updated` 字段（有提交则有值、未提交为 null）。
- [ ] dev 模式（`build-posts --dev`）同样注入，SPA 预览一致。

## Notes

- 轻量任务：build 注入 1 处 + 页面头部 + 1 个新 module.css；产出 `design.md` + `implement.md`。
- 调研依据：`research/meta-research.md`。