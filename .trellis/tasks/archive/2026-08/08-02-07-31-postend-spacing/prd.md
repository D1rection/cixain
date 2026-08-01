# PostEnd 模块间距调整

## Goal

文章底部模块（PostEnd）与正文距离过近（当前 `margin-top: 48px`），恢复类似之前 70vh 留白的"呼吸感"：正文读完 → 留白缓冲 → 模块自然完整呈现。间距用视口比例实现，与旧 70vh 方案同构。

## Requirements

- 桌面端：PostEnd 与正文间距改为视口比例（40vh），滚动到底时模块完整落在视口中
- 移动端：无 ToC 场景下降级（24vh），避免留白过大显得空
- 断点沿用项目现有习惯：`max-width: 768px`（NavBar/Footer 同款）
- 其余样式（终端窗口、间距内 padding）不变

## Acceptance Criteria

- [ ] 桌面端文章滚到底时，正文与模块间约有半屏留白，模块自然完整可见
- [ ] 移动端（<768px）留白约为桌面的一半，不显空
- [ ] 模块内部结构、终端风格、版权行等样式无回归
- [ ] 深浅色主题一致

## Notes

- 仅改 `src/components/PostEnd.module.css` 的 `.end` margin-top + 新增移动端媒体查询
- 轻量任务，PRD-only
