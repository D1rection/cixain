# 引用块内公式渲染 — 执行计划

## 步骤

1. **新增插件 `remarkInlineDisplayMath`**（build-posts.js）
   - 按 design.md 第 2 节实现
   - 接入管线：`.use(remarkMath)` 之后、`.use(remarkObsidianLink)` 之前

2. **删除 `prepareDisplayMath`**（build-posts.js:272-282 的 replace 块）
   - `compileMD` 开头不再对 source 做替换

3. **全量构建验证**
   - `node scripts/build-posts.js` 无报错，所有文章正常产出

4. **边界场景对照**（构造测试文章，对照 prd.md Acceptance Criteria）
   - 引用块同行公式：`> 文字 $$x$$ 文字` → 段内 display，不撕裂
   - 代码块 `$$`：原样保留
   - 行内代码 `$$`：原样保留
   - 嵌套引用：`> > $$a+b$$` 正常
   - 独立行 `$$`、行内 `$...$`：无回归

5. **现有文章抽查**
   - 2026-07-22-001.md（20 个公式块）渲染对照
   - 检查 build 输出的 HTML 中 katex-display / katex 数量与预期一致

6. **清理测试文章**，提交

## Review Gates

- 步骤 3-5 全部通过后进入提交
- 用户本地查看真实文章效果再 push

## Rollback

- git 还原 build-posts.js 即可完全回退
