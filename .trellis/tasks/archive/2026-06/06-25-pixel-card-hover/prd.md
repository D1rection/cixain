# 像素风卡片 hover 效果

## Goal

文章列表卡片 hover 使用像素风交互：左侧 accent 色粗竖线 + 背景微亮，瞬间切换无过渡动画。

## Design Direction

参考像素游戏 UI 的选中效果——选中条目时左侧出现光标指示器，没有平滑动画，瞬间切换。与 TagChip 的"按下去"形成互补交互语言。

## Requirements

- hover 时卡片左侧出现 4px accent 色竖线
- 背景色微亮（light 模式更白，dark 模式更亮）
- 无 transition 动画，即时切换
- 不与现有分隔线冲突

## Acceptance Criteria

- [ ] hover 时左侧竖线动画瞬间出现
- [ ] 暗色/亮色主题下视觉一致
- [ ] 不影响卡片内容布局
