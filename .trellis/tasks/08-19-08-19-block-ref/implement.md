# 块级引用（Obsidian `^id` 锚点跳转）— 执行计划

## 任务顺序

1. `scripts/build-posts.js`：titles 预扫 → toLink 契约修复 → `remarkBlockId` 插件 → 校验 pass。
2. 前端：`src/hooks/useHashScroll.js` 新建 → `BlogPost.jsx` 接入 → `PostContent.module.css` 高亮 + scroll-margin。
3. 验证（不启 dev server，用户自管 5173）：
   - 临时构造 2 篇测试文章（过去日期、非 draft）：`zz-block-demo-target.md`（段/标题/代码/公式/列表各挂 `^id`）、
     `zz-block-demo-source.md`（引用上述各块 + 1 条失效引用）。
   - `npm run build`（后台作业）→ 断言：
     - 目标文生成的 HTML 含 ` id="demo-*"` 各归宿正确；
     - 来源文链接 `href="/blog/zz-block-demo-target#<id>"`、无 alias 文本为目标标题、有 alias 为 alias；
     - 构建日志含失效引用 warn 与汇总条数；
     - `posts.json` 中两篇文章的 slug 正常。
   - 删除两篇测试文 + 派生产物（`zz-block-demo-*.html`、`public/og/zz-block-demo-*.png`）→ 再 build 确认干净。
4. 验收核对 PRD 6 条 AC；桌面/移动端样式由用户 5173 目验（亮暗主题）。
5. Phase 3：spec 更新（content-pipeline.md 记录块引用语法与 toLink 契约）→ 提交计划征求确认 → 归档 + 日志 + 推送。

## 验证命令

- `npm run build`（后台，完成看日志与退出码）
- `grep -o 'id="demo' content/posts/zz-block-demo-target.html` 等断言
- `git status --porcelain` 确认收尾干净（仅剩约定排除的 public/* 与 .obsidian）

## 回滚点

- 每步可独立 revert；插件与前端互不依赖，可分别回退。