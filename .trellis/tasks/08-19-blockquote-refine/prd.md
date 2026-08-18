# 引用块排版优化

## Goal

把文章正文的引用块（blockquote）从"muted 文字 + 左边线"升级为**旁注风**：竖线为主锚点、极浅背景形成"旁注板"、内部公式/多段落不再粘连，且与 callout（彩色卡片）形成清晰的一级弱化层级，贴合博客亮色纸张/暗色 CRT 主题。

## Scope（已确认）

- **普通引用块仅 CSS 改动**：`src/components/PostContent.module.css`（blockquote 规则）+ `src/styles/global.css`（必要时新增 `--quote-*` 变量）。
- **一并处理引用内部分段/列表/公式间距**（内容为公式推导，粘连是当前最大痛点）。
- 不动 callout 现样式（仅保证视觉层级区分）；不动 HTML/JS/构建链路。

## Requirements

1. 引用块：保留 4px 左竖线（accent）+ 新增极浅背景 + 右圆角，与正文区分离成"旁注板"。
2. 文字色由 `muted` 升为正文色（`var(--color-text)`），可读性优先；区分靠背景而非降对比。
3. 引用内段落间距：`p + p` 增加 14px（0.5× 栅格，块内局部豁免）；引用内 `ul/ol` 收紧至 14px；公式块沿用现有 padding，核验不粘连。
4. 亮/暗双主题都成立：亮色 = 暖纸色背景；暗色 = `rgba` 微亮叠层（CRT 近黑底上浮起）。
5. 与 callout 层级区分：callout（全边框+彩色+阴影+图标）强于普通引用（仅竖线+浅背景+圆角）。

## Constraints

- 纯 CSS，不引入依赖、不改 HTML 结构、不分新 JS。
- 字号/行高/垂直节奏体系不变（沿用 `--rhythm-*` token 与 `--content-*` 变量）。
- 不新增选择器覆盖其他组件；CSS Modules 规范不变。

## Acceptance Criteria

- [ ] 亮色：引用块呈现"浅背景 + 左侧 accent 竖线 + 右圆角"，与正文可辨且不刺眼。
- [ ] 暗色：引用块背景微亮于正文底色，竖线为 CRT 绿，无发闷感。
- [ ] 多段落引用（如含推导步骤）段落间有明显间隔（14px），不再粘连。
- [ ] 含公式的引用（2026-07-22 / 2026-08-18 等文章）公式块上下不挤。
- [ ] callout 与普通引用并排出现时层级可辨（彩色卡片 vs 浅底旁注）。
- [ ] `npm run build` 通过；亮/暗 × 桌面/移动抽查无回归（无横向溢出）。
- [ ] 引用内列表（若有）间距不突兀。

## Notes

- 轻量–中等任务：改动集中在 1 个 module.css + 可能 1 处变量；产出 `design.md` + `implement.md`。
- 调研依据见 `research/blockquote-research.md`。