# 移动端内容分类导航调研

## Repository Findings

- `Sidebar.module.css` 在 `<=768px` 隐藏整个侧栏。
- `Sidebar.jsx` 是当前分类计数、系列统计、标签统计的唯一聚合展示面。
- 移动端当前 6 个入口为首页、归档、关于、GitHub、搜索、主题；背景入口已隐藏。
- 当前入口尺寸为 32×32px，且移动端隐藏全部链接文字。
- 标签有文章卡片/文章页上下文入口；系列仅在系列文章目录块出现；不存在分类/系列/标签统一索引页。
- 关于页已有 GitHub 联系方式，因此移动端移除 GitHub 一级入口不会删除该能力。
- 当前生产数据：17 篇文章、3 个系列、11 个标签；全部展示不会造成页面过载。

## External Guidance

### Navigation hierarchy

- Material Design navigation drawer：适合 5 个以上一级目的地或两层以上导航；目的地应按用户重要性排序并使用明确标签。
  - https://m2.material.io/components/navigation-drawer
- Android layout and navigation patterns：紧凑屏幕的导航栏通常容纳 3–5 个同级目的地，更多目的地需使用能够承载层级的导航模式。
  - https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns

### Disclosure semantics

- W3C Disclosure Pattern：展开按钮使用 `aria-expanded` 表达状态，可用 `aria-controls` 关联受控内容；Enter/Space 触发展开。
  - https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
- W3C navigation disclosure example：普通网站导航不应仅因俗称“菜单”而使用复杂的 `menu` 角色。
  - https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/

### Target size

- WCAG 2.2 SC 2.5.8：AA 最小目标尺寸为 24×24 CSS px，或满足间距例外。
  - https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- Apple HIG Buttons：通用建议是至少 44×44pt 的命中区域。
  - https://developer.apple.com/design/human-interface-guidelines/buttons

## Design Implications

- 不为标签和系列各增加一个一级入口，而用一个「浏览」容纳完整分类体系。
- 低频外部 GitHub 退出移动端一级导航，内容发现能力优先。
- 6 个入口仍可横向排列，但使用等宽网格、可见短标签和 44px 命中高度。
- 聚合内容放在独立页面而非菜单内，避免标签数量增长导致导航层过高。
- 分类、系列和标签共用一个确定性统计模型，避免桌面侧栏与移动端页面数据漂移。
