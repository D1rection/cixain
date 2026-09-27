# 排版调研与源码证据

日期：2026-09-27。沿用本任务前序对话已检索的官方资料；这里归档结论，无新增网页复查。

## 外部依据

- W3C《中文排版需求》https://www.w3.org/International/clreq/ ：中文通常密排，字符外框之间不额外加距；常见行间空白为字号的 50%–100%，换算行高约 1.5–2；书籍正文行长常见参考区间 17–40 字。该文档提供排版需求与惯例，不是某个博客的唯一最佳参数。
- USWDS Typography https://designsystem.digital.gov/components/typography/ ：正文有效字号通常至少 16px；连续文本行高至少 1.5，并结合行长和密度调整。
- WCAG 2.2 Visual Presentation https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html ：AAA 条款关注用户可获得的排版方式，含 40 个 CJK 字符行宽目标；不是要求所有站点默认严格采用这些值。
- WCAG 2.2 Text Spacing https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html ：关注用户覆盖间距后不丢失内容/功能，不能将其字距等数值误当默认美学参数。

推论：16px / 1.75 / 0 是适合当前博客的保守共同基准，1.8 也合理。公式引用 2.1 是既有局部设计，非以上规范推荐值。保持主题间几何一致是本任务产品目标。

## 本地依据

- `src/styles/global.css` 定义四个存在主题差异的排版变量。
- `src/components/PostContent.module.css` 正文继承 line-height 和 letter-spacing；blockquote、含 KaTeX 的引用段落使用独立行高；fold 使用正文行高；代码与公式隔离字距。
- `src/pages/About.jsx` 与文章共用 PostContent 样式。
- `src/hooks/useTheme.js` 更新 html 的 data-theme；主题切换不显式调用滚动重置。
- `src/components/ScrollContainer.jsx` 桌面滚动目标为 window，移动端为容器。
- `.trellis/spec/frontend/typography.md` 及历史任务 `archive/2026-08/08-19-typography-breathing/` 明确记录暗色补偿。实现必须更新当前规范，保留历史设计文档。

按默认字号计算，正文行高由 28px 变为 28.8px，字距由 0 变为 0.16px；后者可能改变换行。当前 680px 正文盒含左右 16px 内边距，最大文字可用宽度约 648px。

证据边界：已确认 CSS 因果机制，未在本任务实测像素位移或证明所有代码高亮 token 几何一致。浏览器对照安排在实施阶段。
