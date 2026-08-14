# 懒加载库选型对比（2026-08）

## 结论

选 **vanilla-lazyload@12.5.0**（verlok/vanilla-lazyload）：活跃维护、功能全覆盖本任务需求、约 2KB 零依赖。

## 数据（2026-08-14 实测）

| 库 | npm 月下载 | GitHub 星 | 最近 push | open issues | 评价 |
|---|---|---|---|---|---|
| **vanilla-lazyload** | 260,396 | 7,856 | 2026-06-22 | 13 | ✅ 活跃维护 |
| lazysizes | 957,091 | 17,719 | 2024-04-03 | 209 | ⚠️ 下载量最大但已停更两年 |
| lozad.js | 154,381 | 7,495 | 2025-11-18 | 68 | 维护缓慢，无占位支持 |

下载量第一的 lazysizes 已停更两年（2024-04 后无提交），对依赖浏览器行为的小库风险高；vanilla-lazyload 一个月前仍在发版，issue 仅 13 个。

## 需求覆盖（vanilla-lazyload 12.5.0）

| 本任务需求 | 库能力 |
|---|---|
| IO 懒加载 + data-src | 核心机制：`data-src` 替换 `src` |
| 统一占位图 | `src` 放占位、`data-src` 放原图，加载完成自动换 |
| 淡入 | 加载完成自动加 `class_loaded`（默认 `loaded`）→ CSS 过渡 |
| 错误处理 | `callback_error` |
| SPA 路由 | `update()` 重新扫描 DOM |
| 老浏览器 | 无 IO 时优雅降级为全量加载（无需 polyfill） |
| 配置 | `threshold`（rootMargin，默认 0，拟设 200）、`load_delay` 等 |

## 参考链接

- GitHub: https://github.com/verlok/vanilla-lazyload
- README (unpkg 12.5.0): https://unpkg.com/vanilla-lazyload@12.5.0/README.md
- 占位策略行业综述: https://camoa.github.io/dev-guides/media/image-media-craft/placeholder-strategies/
- 逐图占位（本任务已排除）: BlurHash (Wolt 16k★)、ThumbHash (Evil Martians)、LQIP blur-up

## 占位方案定位

主流占位分两族：
- 逐图生成族（BlurHash / ThumbHash / LQIP）—— 逐图占位，本任务已决策排除（图量小、全部外链 CDN，逐图成本不划算）
- 统一骨架族（Facebook/LinkedIn/GitHub 卡片 shimmer）—— 本任务参考对象，落地为「内联 SVG 终端风占位图」
