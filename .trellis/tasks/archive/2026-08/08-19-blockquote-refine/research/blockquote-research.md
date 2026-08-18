# 引用块（blockquote）优化调研

## 一、现状盘点

- **使用频率**：全站 10 篇文章每篇 2–11 个 `<blockquote>`，是高频内容元素。
- **内容形态**（抽样 10 篇）：全部为**公式推导/算法步骤/概念说明**类文字与公式（如"展开乘积…""初始化 w，重复直到收敛…"），**没有传统引语/名人名言**。
- **当前样式**（`PostContent.module.css`）：
  - 普通引用：`margin 28px 0; padding 12px 20px; border-left 4px accent; color muted;` 无背景
  - 引用内 `p { margin: 0 }` → 多段落/多公式块在引用内**彼此粘连**（Math/代码内容密集时更明显）
  - callout（`blockquote[data-callout]`）：2px 彩色全边框 + 像素阴影 + 图标标题 → 与普通引用是两套体系

## 二、业界做法（调研来源）

| 来源 | 要点 |
|------|------|
| [CSS-Tricks: Getting Creative With Quotes](https://css-tricks.com/getting-creative-with-quotes/) | 引用是"视觉地标"，样式无规则限制；装饰手段：border / 伪元素引号 / 自定义形状；区分 blockquote 与 pull-quote |
| [Slider Revolution: CSS Blockquotes](https://www.sliderrevolution.com/resources/css-blockquotes/) | 主流风格：左侧粗竖线、浅背景板、大引号伪元素、图标化引用 |
| [php.cn: CSS 左侧竖线引用块](https://www.php.cn/faq/2228276.html) | 中文语境最主流做法：`::before` 伪元素做左侧竖线（无需改 HTML） |
| [少数派: Typora 主题 VLOOK 引用块](https://sspai.com/post/105046) / [思源笔记用户指南引述块](https://siyuannote.com/2c34e044def64dfc81c4e0a10f5848f1) | 中文笔记用户主流定制 = **左侧线条 + 块背景色**；VLOOK 提供"引用块换肤" |
| [Foundation: Blockquote Styles](https://get.foundation/building-blocks/blocks/blockquote.html) | 组件化引用：竖线 + 弱化背景 + 引用来源署名（cite） |

**结论**：中文内容场景的主流是"左侧竖线 + 浅背景"。但上述方案多服务"引语"，而本博客引用是**推导说明类内容**——不适合大引号装饰（无引语语义），应走**旁注/注释块**定位，可读性优先。

## 三、设计决策推导

1. **保留左竖线为主锚点**（4px accent）：看一眼即识别，改动最小、风险最低。
2. **新增极浅背景**：与正文区域分开，形成"旁注板"感。亮色用比 `--color-bg` 更暖一档的纸色；暗色用 `rgba(255,255,255,…)` 微亮叠层（CRT 近黑底上"浮起"）。
3. **不加引号伪元素/斜体**：内容没有引语语义，装饰会喧宾夺主。
4. **与 callout 区分**：callout = 全边框 + 彩色 + 像素阴影 + 图标（强）；普通引用 = 仅左竖线 + 浅背景 + 圆角（弱一级）。两层视觉体系不打架。
5. **文字色**：由 `muted` 改为正文色 —— 引用内容是核心推导，muted 对比度不足伤可读性；区分靠背景而非降对比。
6. **内部呼吸**：`p + p` 给 14px（0.5× 栅格，块内局部豁免）；引用内 `ul/ol` 收紧到 14px；公式块沿用全局 `padding 6px 0` 自带呼吸，无需另改。
7. 字号/字距/行高体系不动（沿用上轮 28px 节奏 token）。

## 四、参照验收点

- 亮/暗双主题下引用块与正文、与 callout 的层级关系清晰
- 含公式推导的长引用（如 2026-07-22 / 2026-08-18 文章）多段/多公式不粘连
- 无新增 HTML/JS，纯 CSS（`:last-child` 等结构选择器亦可满足）