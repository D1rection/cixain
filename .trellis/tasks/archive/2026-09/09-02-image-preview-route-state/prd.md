# 修复移动端后退时图片预览遮罩残留

## Goal

将图片预览状态与当前路由绑定，确保移动端后退切换页面时遮罩立即卸载且不新增历史记录。

## Requirements

- TBD

## Acceptance Criteria

- [ ] TBD

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
# P2：移动端后退时关闭图片预览

## 背景

图片预览是挂载在 `App` 顶层的 Portal。预览本身不创建 history entry，但当前状态没有绑定到路由；移动端后退切换到上一页面时，遮罩可能继续覆盖新页面。

## 目标

- 预览打开、切换和关闭不新增浏览器历史记录。
- 路由发生变化时，预览立即卸载；移动端后退后上一页面可正常操作。
- Escape、点击遮罩和键盘切图行为保持不变。

## 验收标准

- 打开预览后执行浏览器后退，URL 和页面切换正常，`[role="dialog"]` 遮罩不存在。
- 后退不需要第二次操作才能点击上一页内容。
- 预览关闭不会调用 `history.pushState` 或 `history.back`。
- SSR/水合和桌面端行为不回归。
