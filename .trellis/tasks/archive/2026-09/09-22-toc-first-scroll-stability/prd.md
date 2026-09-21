# 修复 TOC 首次跳转因懒加载图片引发的位置偏移

## Goal

让读者首次点击目录即可停在正确标题处，不必重复点击。已按设计实现有界定位会话，并随本次提交归档。

## Requirements

- 首次和后续点击保持相同对齐规则，保留平滑跳转。
- 兼容桌面 window、移动端独立容器、SSG 直达和 SPA 导航。
- 支持现有图片尺寸写法，保留懒加载、构建零网络约定。
- 慢图、加载失败不阻塞跳转；用户主动滚动后不得自动拉回。
- 连续点击仅最后一个目标生效；路由、正文版本或滚动目标变化时取消旧请求。
- 尊重减少动态效果设置；文章末尾按实际可滚动范围定位。

## Acceptance Criteria

- [x] ZT1 第二节首次与再次点击，在相关图片于校正窗口内加载完成后，最终位置差 ≤2 CSS px（已在 Chromium 的 601px 移动容器和 1440px 桌面窗口验证）。
- [ ] 390/601/1440px，冷加载与缓存、SSG 与 SPA 均验证上述行为。
- [ ] 多图先后加载、错误占位替换在窗口内可校正；无图文章立即正常跳转。
- [ ] 点击 A/B 后仅 B 生效；滚轮、触摸、滚动键或拖动滚动条后停止校正。
- [ ] 路由、历史正文、滚动目标变化后无旧请求滚动和残留监听。
- [ ] 最长跟踪时限结束后不继续追踪迟到图片，不无限等待或长期吸附标题。
- [ ] 页面底部无法顶对齐时不反复校正。

## Notes

- 已复现：601px 视口，首次标题 top=-92.46px，再次 top=113.04px；前置图片从 402.75px 缩为 195.34px。
- 不包含全站 CLS 消除、图片尺寸采集、批量改文章、块引用或差异导航重构。
- 推荐方案见 design.md；参数在实施验证时可微调，无阻塞出方案的问题。

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
