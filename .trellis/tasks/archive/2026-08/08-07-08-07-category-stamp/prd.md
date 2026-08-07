# 分类印章组件

## Goal

PostCard 卡片中分类与标签共用 TagChip 组件，视觉无区分度。为分类设计独立的"印章"风格组件（accent 实心背景 + 硬阴影），与描边风格的标签形成对比。**仅用于 PostCard 卡片**，Sidebar 分类导航、文章页标题下的分类文本保持现状不动。

## Requirements

- 新建印章组件，替换 PostCard 中的分类 TagChip
- 印章样式：
  - accent 实心背景 + 背景色文字（反白）
  - 保留硬阴影（3px 3px 0）——"盖章盖下去"的视觉
  - 直角（印章无圆角）
  - hover：阴影收拢 + 位移（复用现有交互语言）
- 点击跳转 `/category/:slug`（行为与现在一致）
- 分类文字用 post.category 值（'Tech' / 'Life'）
- 标签（TagChip）样式不动
- 深浅色主题下均正常（accent 在两种主题下对比度需检查）

## Acceptance Criteria

- [ ] PostCard 中分类显示为印章样式，标签保持描边，两者视觉区分明显
- [ ] 点击分类印章 → 跳转 `/category/:slug`
- [ ] 点击标签 → 跳转 `/tag/:slug`（无回归）
- [ ] hover 印章有反馈（阴影收拢 + 位移）
- [ ] 深浅色主题下印章文字可读（对比度足够）
- [ ] 整卡可点击（stretch link）与印章点击不冲突：印章在其上，点印章跳分类页，点印章周边空白进文章
- [ ] Sidebar 分类导航、文章页标题分类文本无改动

## Notes

- 涉及文件：`src/components/CategoryStamp.jsx`（新建）、`CategoryStamp.module.css`（新建）、`src/components/PostCard.jsx`（替换分类渲染）
- 印章组件同样需要 `position: relative; z-index: 1`（stretch link 之上，与 TagChip 一致）
- 轻量任务，PRD 后确认动工
