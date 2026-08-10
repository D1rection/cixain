# 参考链接板块 — 执行计划

## 步骤

1. **新增 `rehypeRefSection` 插件**（scripts/build-posts.js）
   - 按 design.md 第 2-4 节实现：识别 → 归一化 → 注入
   - 挂载位置：`.use(remarkRehype)` 之后、`rehypeCallout` 附近

2. **新增样式**（src/components/PostContent.module.css）
   - 按 design.md 第 5 节

3. **写作模板**（Templates/new-post.md）
   - 末尾加参考板块示例（含纯文本标题 + 链接标题两种写法）

4. **测试文章验证**
   - 建临时文章 `content/posts/__ref-test.md`（非 draft），覆盖：
     - `## 参考` + 两行式条目（纯文本标题 / 链接标题）
     - 单行条目
     - `## 参考实现` 标题（应不命中）
     - `## 参考` 后跟段落（应不命中）
     - 正文普通 ol/ul（样式应不变）
   - `node scripts/build-posts.js` 构建，grep 输出 HTML 验证：
     - `class="ref-list"` 只出现在命中的 ol 上
     - `<br>` 拆分后出现 `ref-url` 段落
     - 参考链接带 `target="_blank" rel="noopener noreferrer"`
     - 正文其他链接无 target
   - 删除临时文章，重新构建确认干净

5. **spec 更新**（.trellis/spec/frontend/content-pipeline.md）
   - 添加参考板块识别约定与写作规范

## Review Gates

- 步骤 4 全部断言通过 → 本地 `npm run dev` 用户预览真实文章效果 → 用户确认后提交
- 提交后用户确认再 push

## Rollback

- 还原 `scripts/build-posts.js` + `PostContent.module.css` 即完全回退；模板与 spec 是文档不影响功能
