# 参考板块移动端溢出修复

## Goal

修复引入参考板块后移动端可水平滚动的问题。根因：参考条目**标题行无换行保护**，标题为长 URL / 长英文无断点文本时把文档宽度撑开（实测 320px 视口被撑到 515px），绕过 `body { overflow-x: hidden }` 兜底。

## Requirements

- 参考条目标题行（`p:first-child`）支持超长无断点内容换行，不再撑开页面
- URL 行（`.ref-url`）断行更自然（当前 `word-break: break-all` 逐字碎裂），防溢出效果不降级
- 全局兜底：正文容器 `.content` 加 `overflow-wrap: anywhere`，同类问题（正文长链接、行内代码）一并免疫
- 正常中文 / 短英文文本断行行为不变（`anywhere` 仅在无其他断点时才断）
- 桌面端行为不变

## Acceptance Criteria

- [ ] 320px 视口下，包含「标题即长 URL」条目的文章 `document.documentElement.scrollWidth == 320`（无水平溢出）
- [ ] 360px / 390px 视口同样无溢出
- [ ] 普通文本条目断行正常（CJK 逐字断、英文按词断）
- [ ] URL 行在 `/`、`.` 等自然位置断行优先，且长 URL 不溢出
- [ ] 桌面端（≥768px）渲染无回归
- [ ] 现有文章零回归（无 参考 板块文章构建产物不变）

## Notes

- 涉及文件：仅 `src/components/PostContent.module.css`
- 轻量任务，`prd.md` + `implement.md` 即可
- 验证方式：headless Chrome（`--remote-debugging-port` + CDP）在 320/360/390px 扫描 `scrollWidth` 与溢出元素
