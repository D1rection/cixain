# Design — 正文区排版垂直节奏重构

## 1. 设计目标

以 28px 为基线构建整倍数垂直节奏，消除正文区"行距与段距分不清、标题与正文粘在一起、各块元素间距一刀切"的问题。设计原则（来自调研）：

- 行高 = 垂直节奏基准单位（impeccable / W3C Vertical Rhythm）
- 中文行高取 1.5–1.75 上界 → 1.75（16px → 28px 整数基线，替代当前 28.8px 非整数基线）
- 段落间距用间距而非首行缩进（与现状一致，不引入缩进）
- 标题行高与正文分离，标题"上方大、下方小"

## 2. 节奏 Token（新增，global.css）

```css
:root {
  /* 垂直节奏栅格：基线 28px = 16px × 1.75 */
  --rhythm-half: 14px;
  --rhythm-1: 28px;    /* 1× 基线：段落、块元素间距 */
  --rhythm-1_5: 42px;  /* 1.5×：h2 上方 */
  --rhythm-2: 56px;    /* 2×：h1 上方 */

  /* 正文排版变量（暗色主题在此覆盖 → 补偿开关） */
  --content-line-height: 1.75;
  --content-letter-spacing: 0;
}

[data-theme='dark'] {
  --content-line-height: 1.8;        /* +0.05 暗底补偿 */
  --content-letter-spacing: 0.01em;  /* +0.01em 暗底补偿 */
}
```

理由：补偿用变量而非选择器嵌套，避免 module css（hash 类名）与 global 选择器打架；theme 切换零成本生效。

## 3. 正文区参数表（PostContent.module.css）

| 元素 | 现值 | 新值 | 依据 |
|------|------|------|------|
| `.content` line-height | 1.8 | `var(--content-line-height)` (1.75) | 基线取整 28px |
| `.content` letter-spacing | — | `var(--content-letter-spacing)` (0) | 暗色补偿通道 |
| `.content` max-width | 680px | **680px（不变）** | 用户确认 |
| h1 | 2rem / 32/16 | 2rem / `56px 0 28px`（2×/1×），lh 1.3 | 标题上方 2× 下方 1× |
| h2 | 1.5rem / 28/12 | 1.5rem / `42px 0 14px`（1.5×/0.5×），lh 1.3 | margin-collapse 后上 ≥42、下 28 → 比值 ≥1.5 |
| h3 | 1.25rem / 24/8 | 1.25rem / `28px 0 14px`（1×/0.5×），lh 1.3 | 同级上方 ≥ 下方 |
| p | 16px 0 | `28px 0`（1× 基线） | 段距 ≥ 行距 |
| pre | 16/16 内边距 | `28px 0` 外边距 + `20px` 内边距 | 块间距入栅格 |
| blockquote | 16px 0 / 8 16 | `28px 0` / `12px 20px` | 同上 |
| callout | 16px 0 / 10 14 | `28px 0` / `14px 18px` | 同上 |
| ul/ol | 16px 0 | `28px 0` | 同上 |
| li | 4px 0 | `8px 0`（豁免项，注释） | 行内微节奏不强制入栅格 |
| img 居中/左右 | 16px auto | `28px auto` | 同上 |
| .table-wrapper | 16px 0 | `28px 0` | 同上 |
| th/td | 8px 12px | `10px 14px` | 单元格呼吸（次要） |

**Margin-collapse 推导（重要）**：标题/段落间距在 CSS margin collapse 下取相邻最大值——

- h2 → p：max(14, 28) = **28px**（1×，标题下方吸住正文）
- p → h2：max(28, 42) = **42px**（1.5×，标题上方留白）
- h2 → h3：max(14, 28) = 28px；h3 → p：max(14, 28) = 28px

结果满足"标题上方 1.5× 下方"验收项，且无需 hack 清除 collapse。

## 4. 移动端规则（≤768px，沿用现有断点）

同一 28px 栅格延续，屏幕高度受限处降档：

| 元素 | 移动端新值 | 理由 |
|------|-----------|------|
| p / 块元素间距 | 28px（与桌面一致） | 栅格一致性 > 特例；343px 文字框 ≈ 21 字/行，符合 18–25 推荐 |
| h1 margin-top | 42px（桌面 56px） | 窄屏 2× 留白过重 |
| h2 / h3 margin-top | 28px（桌面 42/28px） | collapse 后上方/下方均 ≈28px → 1:1，窄屏紧凑；桌面保留 1.5:1 分级 |
| 水平内边距 | 保持现有 16px | 不新增改动，防溢出 |

实现：在 PostContent.module.css 现有 `@media (max-width: 768px)` 块内追加标题间距覆盖（该块目前已存在行号隐藏规则，同块追加不新增断点）。

## 5. 冲突排查矩阵（已核实）

| 触点 | 结论 | 依据 |
|------|------|------|
| 主题机制 | ✅ 零改动 | `useTheme.js` 将 `data-theme` 挂到 `document.documentElement`，与 `[data-theme='dark']` 选择器匹配；变量加进现有块内，继承既有覆盖优先级 |
| 变量命名空间 | ✅ 无冲突 | 现有 `--color-* / --font-* / --callout-* / --shiki-*`；新增 `--rhythm-* / --content-*` 无重名 |
| 其他组件 line-height | ✅ 无影响 | 全仓 13 处 line-height：正文 1.8 外，TOC 1.5 / PostCard 1.4·1.5 / PostEnd 1.6 / TabGroup 1.7 等各自独立，改动只触及 `.content` |
| `.content` 消费者 | ✅ 无影响 | SegmentsRenderer 仅注入 HTML；TableOfContents 仅用 `contentRef` 做滚动定位（与排版无关） |
| 特异性覆盖 | ✅ 已核对 | `li 8px` 不会覆盖 `.ref-list li`（specificity 0,2,1 > 0,1,1）；`p 28px` 不影响 callout/blockquote 内 `p { margin: 0 }` 局部规则 |
| 继承属性泄漏 | ⚠️ 需防护 | `letter-spacing` 会继承：暗色 `0.01em` 会进入 pre/code/KaTeX → 新增显式 `pre, code { letter-spacing: 0 }`（在 `.content` 内） |
| margin-collapse | ✅ 设计内已推导 | 标题/段落取 max，结果为 42/28/28，符合分级目标（见第 3 节） |
| 响应式断点 | ✅ 无冲突 | 复用现有 768px 断点与 16px 水平 padding |

## 6. 未改动项（明确排除）

- 字号体系 16/20/24/32（≈1.25 倍率，调研确认合理）
- 字体栈（系统栈，符合中文规范）
- 行宽 680px、暗色色板、正文 base 16px
- 文章页头（BlogPost.jsx）、列表卡片、侧栏、TOC（范围内外，差异留待后续任务）
- 代码块行高 1.5（代码行距更紧是有意选择）、行内 code 0.9em

## 7. 兼容性与风险

| 风险 | 缓解 |
|------|------|
| 长文变长（间距加大） | 预期内；只影响正文区，滚动成本可接受 |
| dark 补偿变量遗忘覆盖 | 变量集中在 global.css `[data-theme='dark']`，单点维护 |
| margin-collapse 与预期不符（如 callout 内部 p margin 0 与外部 28px 叠加） | implement 时对含 callout/quote 的样例文章逐项核对；AC 含"异常间距校验" |
| 表格/代码横向溢出被间距放大 | 间距不影响 overflow-x 行为，仅垂直方向 |

## 8. 验收对照方式

- `research/current-state.md` → `design.md` 参数表逐项 diff（现值 → 新值）
- 亮/暗截图对比：正文区段距 > 行距、标题留白分级、块元素间距一致
- DevTools 检查 computed style 验证栅格值与 margin-collapse 结果