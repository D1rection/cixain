# 参考板块移动端溢出修复 — 执行计划

## 步骤

1. **改 CSS**（src/components/PostContent.module.css）
   - `.content` 加 `overflow-wrap: anywhere`（全局兜底）
   - `.ref-list li p:first-child` 加 `overflow-wrap: anywhere`（标题行）
   - `.ref-list .ref-url` 的 `word-break: break-all` 改为 `overflow-wrap: anywhere`

2. **复现与验证**（headless Chrome CDP）
   - 临时文章 `content/posts/__ref-mobile-preview.md`（draft，含「标题即长 URL」条目）已存在
   - 用 CDP 脚本（/tmp/cdp-scan.mjs）扫描 320/360/390px：
     - 修复前：320px 时 `docScrollW = 515`（已复现）
     - 修复后：`docScrollW == 视口宽`，无溢出元素
   - 检查普通文本条目断行正常

3. **清理**：删除临时预览文章 .md + .html，重建确认干净

4. **提交**（Angular 规范，≤10 字），push 前询问用户

## Review Gates

- 步骤 2 三个宽度全部通过 → 用户本地确认移动端效果 → 提交

## Rollback

- 还原 PostContent.module.css 单文件即可
