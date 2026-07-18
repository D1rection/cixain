# Callout 图标方案设计

## 实现方式

CSS `::before` 伪元素 + `data-callout` 属性选择器。不对 rehype 插件和 HTML 结构做任何改动。

```
标题前图标 + 标题文字（callout-color）     ← 双重颜色标识
┌──────────────────────────────────────┐
│ 边框 2px                             │
│ box-shadow 3px 3px 0 颜色            │  ← 三重标识
└──────────────────────────────────────┘
```

Unicode 符号选择原则：几何图形，契合像素复古调性，不使用 emoji。

## 符号映射表

| 类型 | 符号 | Unicode | 
|------|------|---------|
| note | ■ | U+25A0 |
| info | ℹ | U+2139 |
| abstract | ◇ | U+25C7 |
| warning | ⚠ | U+26A0 |
| question | ？ | U+FF1F |
| tip | ◆ | U+25C6 |
| success | ✓ | U+2713 |
| danger | ✕ | U+2715 |
| failure | ✗ | U+2717 |
| bug | ✦ | U+2726 |
| example | ❖ | U+2756 |
| quote | ❝ | U+275D |

## CSS 结构

在 `.content` 下新增规则：

```css
.content :global(blockquote[data-callout]) :global(.callout-title)::before {
  margin-right: 6px;
}

.content :global(blockquote[data-callout="note"]) :global(.callout-title)::before { content: '■'; }
.content :global(blockquote[data-callout="warning"]) :global(.callout-title)::before { content: '⚠'; }
/* ...每种类型一条 */
```

## 颜色修正

暗色模式下 `--callout-tip` 当前为 `#3fb950`（与 `--callout-note` 相同），需改为 `#58b9c0`（青蓝）以区分。
