# Design — 引用块旁注风改造

## 1. 目标形态

普通引用块从"裸左边线"升级为**旁注板**：

```
┃ 4px accent 竖线                                        ┐
┃   正文色推导文字（可读性优先）                          │ 右圆角
┃   …下一段（p+p 间隔 14px）…                             │ 8px
┃   极浅背景（亮=暖纸 / 暗=rgba 微亮叠层）                 │
└─────────────────────────────────────────────────────────┘
```

与 callout 的层级：callout（2px 全边框 + 彩色 + 像素阴影 + 图标标题）> 普通引用（仅竖线 + 浅背景 + 圆角）。两层体系不打架。

## 2. 新增变量（global.css）

```css
:root, [data-theme='light'] {
  --quote-bg: #efe7d6;              /* 暖纸色，略深于 --color-bg(#f4efe6) */
}
[data-theme='dark'] {
  --quote-bg: rgba(255, 255, 255, 0.05);  /* CRT 近黑底上微亮浮起 */
}
```

理由：亮色取"比底色更暖更实"的米色形成凹陷板感；暗色用 `rgba` 叠层避免纯色块突兀，也兼容任何背景壁纸。

## 3. 参数表（PostContent.module.css）

| 规则 | 现值 | 新值 |
|------|------|------|
| `.content blockquote` padding | 12px 20px | **14px 20px**（上下略增，配合浅背景呼吸） |
| 同 background | 无 | `var(--quote-bg)` |
| 同 border-radius | 0 | **0 8px 8px 0**（右圆角，呼应卡片语言；左有竖线不全圆角） |
| 同 color | `var(--color-muted)` | **`var(--color-text)`**（推导内容可读性优先） |
| 同 border-left | 4px accent | 不变（主锚点） |
| 同 margin | 28px 0 | 不变（栅格） |
| `.content blockquote p` | `margin: 0` | 保留；**追加 `p + p { margin-top: 14px }`**（块内局部 0.5×，多段不粘连） |
| 引用内 ul/ol | `margin 28px 0`（继承 .content） | **`margin: var(--rhythm-half) 0`**（块内收紧） |
| 引用内公式 | 全局 `.katex-display { padding: 6px 0 }` | 不变（自带呼吸），实施时对含多公式的引用核验 |

## 4. 特异性与冲突

- 普通引用选择器 `.content blockquote`（0,1,1）不受 callout 规则影响（callout 用 `:global()` 0,2,1 更高且属性不同）。
- `p + p` 相邻选择不破坏 `blockquote p { margin: 0 }`（首段仍 0，第二段起 14px）。
- 引用内列表规则 `.content ul, .content ol` 与 `.content blockquote ul`（0,1,2 更高）→ 块内收紧要写在 blockquote 悬垂选择器下保证特异性。
- 暗色竖线走现有 `--color-accent`（CRT 绿）自动切换，零新增。

## 5. 风险与回滚

| 风险 | 缓解 |
|------|------|
| 浅背景与正文/卡片区分度不足 | 亮色 `#efe7d6` 与 bg `#f4efe6`、card `#f6f2ea` 均有可感知差（+8~10 亮度步进）；若不足可加深一档 |
| 暗色 rgba 叠加在不同壁纸上的观感 | 背景遮罩 `body::after` 已有 0.92 不透明度底色，引用 bg 在其上叠层，观感可控 |
| 公式在引用内仍挤 | 实施时以 2026-07-22（11 个引用）为样本核验；必要时给引用内 `.katex-display` 加 `margin: 4px 0`（design 预留项） |
| 回滚 | 单文件 CSS，`git checkout --` 即回滚 |

## 6. 验收对照

- `research/blockquote-research.md` 决策表 → 本参数表逐项落实
- 亮/暗、桌面/移动 computed style 抽查 + 模型站 2 篇文章（含多公式引用）目测

## 7. 实现中发现（实测修正，2026-08-19）

**问题**：带 `\boxed` 的行内公式在引用块中与相邻行贴死（实测 box 行与上一高公式行间隙 **-3px 重叠**）。

**排查结论**：
1. 行内元素（`.katex`）的垂直 padding **不参与行盒高度计算** —— padding 2/4/6px 实测全部零效果，不是有效杠杆。
2. 行高是唯一有效杠杆；但引用整体提到 2.0 仍残留 2 处负间隙（内容高 ≈33px 超出行盒）。
3. 唯一全绿解：**`:has()` 精准命中含公式的引用段落**，仅这些段落行高提到 2.1（暗色 2.15）。

**最终配置**（推翻第 3 节"公式沿用全局 padding 即可"的假设）：
- `--quote-line-height: 1.9 / 1.95`（引用整体，暗色按补偿逻辑 +0.05）
- `--quote-math-line-height: 2.1 / 2.15` + `.content :global(blockquote p:has(.katex))` 只命中含公式段落，纯文本引用不受影响
- 移除无效的 `.katex` vertical padding 规则

**实测结果**：相邻引用行间隙 min -3px → **min 0 / avg 13px / 零负间隙**；含公式段落行盒 33.6px（2.1×16）。