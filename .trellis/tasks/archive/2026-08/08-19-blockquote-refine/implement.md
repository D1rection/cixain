# Implement — 引用块旁注风改造执行计划

## 1. 实施步骤

1. **global.css**：`[data-theme='light']` 块加 `--quote-bg: #efe7d6`；`[data-theme='dark']` 块加 `--quote-bg: rgba(255,255,255,0.05)`。
2. **PostContent.module.css**（按 design.md 第 3 节）：
   - `.content blockquote`：padding → `14px 20px`、background → `var(--quote-bg)`、border-radius → `0 8px 8px 0`、color → `var(--color-text)`；margin/border-left 不变
   - 追加 `.content blockquote p + p { margin-top: 14px }`
   - 追加 `.content blockquote ul, .content blockquote ol { margin: var(--rhythm-half) 0 }`
3. **公式核验**：打开 2026-07-22（11 个引用）与 2026-08-18 文章，确认引用内多段/多公式不粘连；若仍挤，追加 `.content blockquote :global(.katex-display) { margin: 4px 0 }`（design 预留项）。

## 2. 自验（gate 1）

- `npm run build` 通过
- dev 浏览器 computed style 抽查：blockquote background（亮 `rgb(239,231,214)` / 暗 `rgba(255,255,255,0.05)`）、padding `14px 20px`、color 正文色、border-radius `0 8px 8px 0`
- p+p 实际渲染间距 14px；引用内列表 14px

## 3. 回归（gate 2）

- callout 与普通引用同页出现（找一篇同时有的文章），层级可辨
- 亮/暗 × 桌面/移动：无横向溢出、公式不溢出
- 无选择器泄漏（grep 确认新增规则都挂在 `.content` 下）

## 4. 完成后

- 按 Phase 3.3 判断：是否把"引用块旁注风约定"补进 `.trellis/spec/frontend/typography.md`