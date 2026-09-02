# 修复图片预览污染浏览器历史

## Goal

图片预览关闭后不应新增历史记录或影响后退行为。

## Requirements

- TBD

## Acceptance Criteria

- [ ] TBD

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
# P2：图片预览不污染浏览器历史

## 需求

图片预览是页面内覆盖层，不应通过 `history.pushState` 创建伪页面。打开、切换、关闭预览均保持当前 URL 和历史栈不变；用户点击浏览器后退时关闭预览并继续正常路由回退。

## 验收标准

- 预览组件不新增 history entry。
- Escape、遮罩点击和浏览器后退都能关闭预览。
- 键盘切换图片、滚动锁定和 SSR 渲染行为不受影响。
