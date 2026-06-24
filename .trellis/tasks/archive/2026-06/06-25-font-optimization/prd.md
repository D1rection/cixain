# 字体加载优化

## Goal

消除对 Google Fonts 的外部依赖，自托管 Press Start 2P 字体，减少阻塞渲染和额外网络请求。

## Requirements

- 移除 `index.html` 中的 Google Fonts `<link>` 标签
- 使用 `@fontsource/press-start-2p` 自托管字体文件
- 保留 `--font-pixel` 等 CSS 变量的兼容性
- 字体加载不应阻塞首次渲染
- 仅导入 latin 子集，减少不必要文件

## Acceptance Criteria

- [x] 页面初始加载不请求 `fonts.googleapis.com` 或 `fonts.gstatic.com`
- [x] 品牌文字 "Cicada's blog" / "cixain" 正常渲染像素字体
- [x] 亮色/暗色双主题下字体一致
- [x] `npm run build` 正常通过
- [x] 字体文件从 7 个降到 2 个（仅 latin 子集）
