# Typography — 正文排版约定

> 来源：task `08-19-typography-breathing`（垂直节奏重构）。正文排版修改前先读本页。

## 垂直节奏（Vertical Rhythm）

- 基线 = 16px 字 × 1.75 行高 = **28px**。正文区所有块级间距取 28px 的倍数。
- 节奏 token 定义在 `global.css` `:root`：

  ```css
  --rhythm-half: 14px;   /* 0.5× */
  --rhythm-1: 28px;      /* 1×  段落/块元素间距 */
  --rhythm-1_5: 42px;    /* 1.5× h2 上方 */
  --rhythm-2: 56px;      /* 2×  h1 上方 */
  ```

- 禁止在组件样式中散落魔法间距数字；一律引用 token（若某间距"刚好不在栅格上"，先质疑它是否需要存在）。

## 主题驱动的正文排版变量

- `.content` 的 `line-height` / `letter-spacing` 必须引用以下变量，不得写死：

  ```css
  --content-line-height: 1.75;   /* 亮色 */
  --content-letter-spacing: 0;
  [data-theme='dark'] {
    --content-line-height: 1.8;      /* 暗底补偿：+0.05 */
    --content-letter-spacing: 0.01em; /* 暗底补偿：+0.01em */
  }
  ```

- 暗底补偿走变量覆盖而非选择器嵌套——module.css 的 hash 类名无法被 global 选择器可靠命中，变量是唯一不打架的通道。
- 继承防护：`pre / code / .katex` 显式 `letter-spacing: 0`，阻断暗色补偿字距进入代码与公式。

## 标题规则

- 标题 `line-height: 1.3`（与正文 1.75 分离）；间距取 `上方 ≥ 1.5× : 下方 0.5×`，靠 margin-collapse 自然折叠（h2 上方 42 / 下方 28）。
- 移动端（≤768px）标题上方降档一档（h1→42px、h2→28px），段落间距保持 28px。
- 段落间距用 `margin`，不引入首行缩进（与现状一致）。

## 引用块（blockquote）约定

> 来源：task `08-19-blockquote-refine`。博客引用内容为公式推导/说明，非引语 → 走"旁注板"而非引号装饰。

- 形态：4px accent 左竖线（主锚点）+ 右圆角 `0 8px 8px 0` + 半透明叠层背景 + 正文色。
- 背景统一用半透明叠层（**不用实色**，与暗色同策略）：亮 `--quote-bg: rgba(0,0,0,0.04)` / 暗 `rgba(255,255,255,0.05)`。
- 行高杠杆：
  - 引用整体 `--quote-line-height: 1.9 / 1.95`（暗色按补偿逻辑 +0.05）。
  - 含公式的引用段落（`:has(.katex)`）`--quote-math-line-height: 2.1 / 2.15`——行内数学符号（积分/分式 ≈29px）的行盒必须更松，否则与相邻行贴死。
- **教训**：行内元素（`.katex`）的垂直 padding **不参与行盒高度计算**，撑不开相邻行；公式行间距唯一有效杠杆是 `line-height`。
- 块内分段：`blockquote p + p { margin-top: 14px }`（块内局部 0.5×，不入全文栅格）；引用内 `ul/ol` 同样收紧 14px。
- 与 callout 层级：callout（全边框+彩色+图标+阴影）强于普通引用（仅竖线+叠层），两套体系不得互相覆盖。