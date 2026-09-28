# 视觉参考与本地依据

整理日期：2026-09-29。延续本对话上一轮已完成的官网检索；浏览器预览尝试超时，没有完成截图对照。以下依据官方页面文字与样式说明，不声称已做页面渲染验证。

## Gwern：主要参考
- 文章：https://gwern.net/design
- 样式指南：https://gwern.net/style-guide
- 指南描述摘要使用细灰边框、轻微偏白背景和略收紧的版心，支持多段内容。
- 本项目借鉴：低装饰的摘要边界与中性底色；不照搬站点字体、栏宽或旁注结构。

## Ink & Switch：开篇组织
- https://www.inkandswitch.com/article-style-guide/
- 指南将文章引入区置于标题、署名之后，以段落概述后续内容。
- 本项目借鉴：作为文章连续阅读的一部分，利用标题和段落节奏建立层级。

## Tufte CSS：阅读节奏
- https://edwardtufte.github.io/tufte-css/
- 官方强调简洁排版、谨慎选择字体、图文融合与旁注。
- 本项目借鉴：克制标题和留白；不引入其西文字体、small caps 或旁注布局。

## 本地依据
- `src/styles/global.css`：浅色复古纸张、深色 CRT 色板；强调色为锈红/绿色，14px 与 28px 节奏变量。
- `src/components/PostContent.module.css`：现有 overview 的独立蓝色底、粗侧边、硬阴影；通用 callout 的段落 margin 归零。
- `.trellis/spec/frontend/typography.md`：明暗几何一致，引用公式行高、块内 14px 节奏。
- `.trellis/spec/frontend/component-guidelines.md`：CSS Modules、主题变量、归档与文章索引的轻量设计约定。

## 工作流说明
已读取 `.trellis/workflow.md`。当前环境未找到 `trellis-brainstorm` 技能文件，依照工作流的规划规范直接整理文档；用户已明确授权通过 Trellis 设计方案，未授权本轮开始实施。
