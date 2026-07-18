# Callout 图标方案

## Goal

为 Obsidian callout 添加图标识别，不同 callout 类型在标题前显示不同符号，提升视觉区分度。

## Requirements

- 纯 CSS 实现，不改 HTML 结构（不改 rehype 插件）
- 标题前通过 `::before` 添加 unicode 符号
- 符号颜色继承 `var(--callout-color)`
- 不动现有边框和 box-shadow 的像素块风格
- 暗色模式下 tip 和 note 颜色需区分

## 涉及文件

- `src/components/PostContent.module.css` — 主要改动
- `src/styles/global.css` — 暗色 tip 颜色区分（可选）

## 验收标准

- [ ] 每种 callout 类型标题前有对应符号
- [ ] 符号颜色与 callout 类型颜色一致
- [ ] 现有边框和阴影风格不变
- [ ] 暗色模式下各类型颜色可区分
