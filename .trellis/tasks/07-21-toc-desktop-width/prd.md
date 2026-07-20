# 桌面端 ToC 宽度调整

## Goal

桌面端右侧固定 ToC 侧边栏宽度从 180px 增至 220px，改善中文标题显示。

## 改动

`src/components/TableOfContents.module.css`（第 77~86 行）：

| 属性 | 原值 | 新值 |
|------|------|------|
| `min-width` (断点) | 1150px | 1200px |
| `left` | calc(50% + 380px) | calc(50% + 400px) |
| `width` | 180px | 220px |

布局变化：
- 内容区 680px → 右侧沿 50%+340px
- ToC 左侧 50%+400px → 间距 60px
- ToC 宽度 220px → 右侧沿 50%+620px
- 1200px 视口下刚好不溢出

## 涉及文件

- `src/components/TableOfContents.module.css`

## 验收标准

- [ ] 桌面端（≥1200px）ToC 宽度为 220px
- [ ] 1150~1199px 之间 ToC 回到行内模式
- [ ] 文章无布局偏移异常
