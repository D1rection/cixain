# 文章卡片整卡可点击

## Goal

文章列表卡片（PostCard）目前只有标题可点击进入文章，卡片其他区域（描述、空白处）点击无效，但 hover 时整卡高亮——视觉与行为不一致。改为整卡可点击（stretch link），同时**确保分类/标签 chip 的点击逻辑不受影响**（点击 chip 仍跳转 tag/category 页，不进入文章）。

## Requirements

- 卡片任意位置点击（描述、日期、空白区）→ 进入文章详情页
- 点击分类/标签 chip → 仍跳转 tag/category 筛选页（**不进入文章**）
- 标题链接行为不变
- hover 高亮、左侧 accent 竖条等视觉反馈保持
- 键盘可达性：标题链接仍可 Tab 聚焦（stretch link 不应破坏可访问性）
- 移动端点击区域正常，无误触

## 关键约束（避免与 chip 点击逻辑产生 bug）

- stretch link 覆盖层不能盖住 chip（否则 chip 点击会被覆盖层拦截，跳转文章而非筛选页）
- 覆盖层必须是透明、不可聚焦的（`pointer-events` / z-index 方案需验证）
- 卡片内嵌套交互元素（chip 链接）需提升层级，确保先响应 chip 点击

## Acceptance Criteria

- [ ] 点击卡片描述/空白区域 → 进入文章页
- [ ] 点击分类 chip → 跳转 `/category/:slug`，不进入文章
- [ ] 点击标签 chip → 跳转 `/tag/:slug`，不进入文章
- [ ] 点击标题 → 进入文章页
- [ ] hover 视觉反馈无回归（整卡高亮 + 竖条）
- [ ] 键盘 Tab 聚焦标题可正常 Enter 进入文章
- [ ] 移动端（<768px）点击行为正确

## Notes

- 涉及文件：`src/components/PostCard.jsx`、`src/components/PostCard.module.css`、`src/components/TagChip.jsx`（或仅 CSS）
- 业界方案：stretch link（`.card::after` 透明覆盖层 + `position: relative` 提升 chip 层级）
- 轻量任务，PRD 后确认即可动工
