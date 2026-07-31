# SPA 导航滚动位置处理

## Goal

修复 SPA 客户端导航时滚动位置保留的问题：文章/页面之间跳转后应回到页面顶部，而不是停留在上一个页面的滚动位置。

## Requirements

- 路由变化（pathname 变化）时滚动回顶部
- 不破坏锚点跳转（ToC 的 `#id` 平滑滚动、带 hash 的链接）
- 页面内交互（搜索打开、主题切换、图片预览）不触发滚动重置
- 深浅色主题、SSG 首屏（无路由变化不滚动）均正常
- 移动端与桌面端一致

## 业界方案调研（2025–2026）

1. **ScrollToTop 组件**（通用做法，React Router 官方推荐）：
   - `useLayoutEffect`（绘制前执行，避免闪烁）
   - 依赖 `pathname`（仅路由变化触发，忽略 re-render）
   - hash 存在时跳过（保留锚点行为）
   - iOS Safari 需 fallback（`document.documentElement.scrollTop = 0`）

2. **React Router 内置 `<ScrollRestoration />`**（v6.4+ Data Router）：
   - 导航回顶 + 后退自动恢复位置（sessionStorage 记录）
   - 本项目用 **wouter**，无此内置组件，需自行实现

3. **手动 scrollRestoration = 'manual' + 位置保存**（进阶）：
   - 前进回顶、后退恢复
   - 需处理 async 渲染时序（DOM 高度不足时恢复偏移错误）、popstate 时序等
   - 实现复杂，多数博客不采用

## 方案选择

**采用方案 1（ScrollToTop 组件）**，理由：
- 简单可靠，符合大多数博客行为（新页面从头读）
- 本项目 wouter 路由，无内置方案
- 后退恢复属于锦上添花，博客内容页场景价值低（用户浏览文章后返回列表更期望从列表头部看起）

## Acceptance Criteria

- [ ] 文章 A 滚动到中部 → 点链接跳到文章 B → 页面位于顶部
- [ ] 首页滚动到第 2 页底部 → 点进文章 → 文章页位于顶部
- [ ] ToC 锚点跳转仍平滑滚动到对应标题，不受影响
- [ ] 搜索框打开/关闭、主题切换不触发滚动重置
- [ ] 直接输入 URL 加载（无导航）不产生多余滚动
- [ ] 移动端正常

## Notes

- wouter 的 `useLocation()` 返回 `[location, navigate]`，location 即 pathname
- 项目无 React Router，不引入新依赖
