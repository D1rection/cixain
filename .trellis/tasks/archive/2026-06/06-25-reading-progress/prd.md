# 阅读进度条

## Goal

在文章详情页顶部显示细条阅读进度指示器，提升阅读体验。

## Requirements

- 固定定位在页面顶部（导航栏下方）
- 随页面滚动实时更新进度百分比
- 仅文章详情页显示，首页/关于/404 不显示
- 细条高度 2-3px，使用 accent 主题色
- 性能：使用 passive scroll listener 或 IntersectionObserver

## Acceptance Criteria

- [x] 滚动文章时顶部细条从 0% 平滑填充到 100%
- [x] 非文章页面不显示进度条
- [x] 亮色/暗色双主题下颜色与 accent 一致
