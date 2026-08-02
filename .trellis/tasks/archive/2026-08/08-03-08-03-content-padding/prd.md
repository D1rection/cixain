# 正文移动端边距对齐

## Goal

文章正文（`.content`）在移动端距屏幕边缘只有外层 16px，而标题区、PostEnd、ToC 均为 32px（外层 16 + 内层 16）。正文成为唯一"不合群"的区块，视觉上贴着屏幕边缘，与上下区块不对齐。

修复：给正文补上与其他区块一致的约束，实现页面内所有区块边距统一。

## Requirements

- 正文 `.content` 增加 `max-width: 680px; margin: 0 auto; padding: 24px 16px 0`，与标题区/PostEnd/ToC 的容器约束完全一致
- 桌面端：正文内容区与标题区（680px 容器）精确对齐（此前正文占满 688px 外层宽，比标题区宽 8px）
- 移动端：正文距屏幕边缘 32px，与标题区/PostEnd 对齐
- 深浅色主题、移动/桌面均正常

## 设计依据（调研）

- 移动端侧边距规范：16–20px/侧（16px=1rem 基线）
- 本页其他区块（标题/PostEnd/ToC）均为 32px（外层 16 + 内层 16），正文统一到 32px
- "留白宁可多不可少"，页面内一致性优先于字面规范值

## Acceptance Criteria

- [ ] 移动端正文左右边距与标题区、PostEnd 对齐（32px）
- [ ] 桌面端正文内容区与标题区容器对齐（680px）
- [ ] 正文内部样式（行高、标题、代码块等）无回归
- [ ] 深浅色主题一致

## Notes

- 仅改 `src/components/PostContent.module.css` 的 `.content`（1 处）
- 轻量任务，PRD-only
