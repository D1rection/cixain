# Implement — 正文区排版垂直节奏重构执行计划

## 前置

- [x] PRD 已评审（用户确认 4 项范围选择）
- [ ] `task.py start` 后进入实施（等待确认）

## 1. 实施步骤（顺序执行）

1. **global.css：新增节奏与排版变量**
   - 在 `:root` 增加 `--rhythm-half/1/1_5/2`、`--content-line-height: 1.75`、`--content-letter-spacing: 0`
   - 在 `[data-theme='dark']` 增加 `--content-line-height: 1.8`、`--content-letter-spacing: 0.01em`
   - 验证：`grep` 确认变量只出现在 global.css 主题层

2. **PostContent.module.css：按 design.md 参数表落值**
   - `.content`：line-height → `var(--content-line-height)`，新增 `letter-spacing: var(--content-letter-spacing)`
   - 标题：h1/h2/h3 行高 1.3 + 间距 56/28、42/14、28/14（px）
   - p → 28px 0；pre/blockquote/callout/ul/ol/table-wrapper/img → 28px 0 与 padding 调整
   - li → 8px 0（注明豁免）；th/td → 10px 14px
   - **冲突防护**：`.content pre, .content code { letter-spacing: 0 }`（阻断暗色字距继承进代码；KaTeX 一并核对）
   - **移动端**：现有 `@media (max-width: 768px)` 块内追加 h1/h2/h3 margin-top 降档覆盖（design.md 第 4 节）
   - 逐项核对 design.md 第 3 节表格

3. **自验（第 1 道 gate）**
   - `npm run build` 通过
   - `npm run dev` + 浏览器打开一篇典型长文（含代码块/callout/表格/引用），DevTools 抽查 computed style：
     - p margin = 28px；块元素 margin = 28px
     - h2 margin-top ≥ 42px（collapse 后）、标题 lh = 1.3
     - 切暗色主题：`.content` line-height = 1.8、letter-spacing = 0.01em；**pre/code letter-spacing = 0**（防护生效）
   - 检查 margin-collapse 异常（如 callout 内首个/末个元素嵌套叠加导致间距 >28px）

4. **双主题截图对比（第 2 道 gate）**
   - 亮色：段落边界清晰、标题上下留白分级、块元素间距一致
   - 暗色：补偿生效、无发闷感
   - 与改动前截图对比，确认符合"呼吸感"目标

5. **回归抽查（第 3 道 gate）**
   - **冲突回归**：文章页 TOC 滚动定位、PostEnd/页头、列表页卡片与改动前截图对照
   - **移动端**：DevTools 375px 视口切换，验证标题降档、无横向溢出、暗色补偿生效，截图
   - 翻页目录（TOC）位置、懒加载图片、KaTeX 公式块间距不因此改动而错乱
   - `npm run build` 最终全量通过

## 2. 验收命令

```bash
npm run build        # 构建链路（vite + SSG 渲染）通过
npm run dev          # 浏览器验证与截图
```

## 3. 回滚点

- 改动仅两个 CSS 文件（global.css 变量区 + PostContent.module.css），`git checkout -- <file>` 即回滚
- 若暗色变量覆盖导致主题切换异常，先回退变量方案改回选择器（design.md 第 2 节有预案说明）

## 4. 完成后

- 运行 `/trellis:finish-work` 归档任务前，按 Phase 3.3 判断是否需要把"节奏 token + 暗色补偿变量"经验写回 `.trellis/spec/frontend/`