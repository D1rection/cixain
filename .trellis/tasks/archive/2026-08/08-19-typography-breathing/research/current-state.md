# 现有排版参数盘点（从代码提取）

> 来源文件：`src/styles/global.css`、`src/components/PostContent.module.css`、`src/components/Layout.module.css`、`src/pages/BlogPost.jsx`（文章页骨架）。
> 正文基字号：未显式声明 → 浏览器默认 **16px**。

## 一、文章正文区（`.content`，PostContent.module.css）

| 项 | 现值 | 备注 |
|----|------|------|
| 行宽 | `max-width: 680px` | 16px 中文下约 **42 字/行**，略超中文推荐 30–40 字 |
| 内边距 | `24px 16px 0` | |
| 行高 | **1.8**（= 28.8px 基线） | 超过中文推荐上界 1.75；且 28.8px 非整数 |
| h1 | 2rem；`margin 32px 0 16px` | |
| h2 | 1.5rem；`margin 28px 0 12px` | 行高继承 1.8（未单独收紧） |
| h3 | 1.25rem；`margin 24px 0 8px` | 行高继承 1.8 |
| 段落 p | `margin: 16px 0` | 16px 与 28.8px 基线不成倍数 |
| 代码块 pre | `margin 16px 0`；`padding 16px`；`font-size 0.9rem`；`line-height 1.5` | |
| 行内 code | `0.9em` | |
| 引用 blockquote | `margin 16px 0`；`padding 8px 16px` | |
| Obsidian callout | `margin 16px 0`；`padding 10px 14px` | |
| 列表 ul/ol | `margin 16px 0`；`padding-left 24px` | |
| 列表项 li | `margin 4px 0` | |
| 图片 img | `max-width 100%`；居中类 `margin 16px auto` | |
| 表格 table | `font-size 0.9rem`；th/td `padding 8px 12px` | |

## 二、文章页骨架（BlogPost.jsx + Layout.module.css）

| 项 | 现值 | 备注 |
|----|------|------|
| 文章标题区 | `maxWidth 680, padding '32px 16px 0'` | 标题下 8px 才是日期行（muted） |
| 内容区缩进 | `.content` 又自带 `padding 24px 16px 0` | 标题区与正文区留白各自为政 |
| 页面容器 | `max-width: 1200px`；`padding 32px 16px`；gap 48px | 侧栏布局 |
| 正文列 | `.main` flex:1 + `.content` 680px | 实际正文列随侧栏宽度收缩 |

## 三、全局（global.css）

| 项 | 现值 |
|----|------|
| html 行高 | `line-height: 1.6` |
| 字体栈 | `system-ui`（中文走系统字体 ✓，符合中文规范"默认系统栈"） |
| 暗色 | 无排版补偿（仅换色板）；正文色 `#c5ccc3` |

## 四、问题清单（与基准对照后的初步诊断）

1. **段落感弱**：段距 16px < 行距余量，段落边界不清晰 → 最影响"呼吸感"
2. **垂直节奏错拍**：所有 16px 间距与 28.8px 行高基线无倍数关系
3. **标题拥挤、层级不足**：h2/h3 行高继承 1.8；h2 上下间距绝对值偏小（28/12）；h3 为 24/8
4. **行宽略宽**：680px ≈ 42 字/行（中文推荐 30–40）；可收窄或保留（可选）
5. **暗色无补偿**：未做行高/字距/对比三轴补偿
6. **标题区与正文区留白不统一**：32px vs 24px vs 16px 三套数字
7. 代码/引用/图片/表格间距一刀切 16px，无分级

> 注：字号层级（16/20/24/32 ≈ 1.25 倍率）本身合理，不需要改字号体系；改动集中在**间距/行高/节奏**。