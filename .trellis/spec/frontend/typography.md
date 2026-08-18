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