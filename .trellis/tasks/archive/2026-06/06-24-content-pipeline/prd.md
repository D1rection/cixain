# 内容管线

## 目标

实现 build-posts.js：遍历 content/posts/*.md，提取 frontmatter，编译为 HTML，产出 posts.json 和文章 HTML。

## 具体内容

1. 安装依赖：gray-matter、unified、remark-parse、remark-rehype、rehype-stringify、@shikijs/rehype
2. `scripts/build-posts.js`：
   - 遍历 content/posts/*.md
   - gray-matter 提取 frontmatter（title、date、description 为必需）
   - slug = 文件名（去掉 .md）
   - unified + remark-parse + remark-rehype + rehype-shiki(github-dark) + rehype-stringify
   - 处理 react:xxx 代码块：提取为 interactive 元数据，替换为 data-interactive 占位符
   - 排序：按 date 降序
   - 过滤：draft 文章在生产构建跳过，未来日期跳过
   - 输出 content/posts.json + content/posts/[slug].html
3. 同时处理 content/pages/about.md → content/pages/about.html
4. 创建一篇示例文章用于验证

## 验收标准

- [ ] `node scripts/build-posts.js` 成功执行
- [ ] 产出 content/posts.json（文章元数据数组）
- [ ] 产出 content/posts/[slug].html（文章正文 HTML）
- [ ] 代码块正确高亮
- [ ] react:xxx 代码块被提取为 interactive 数据
- [ ] dev 模式（--dev 参数）包含 draft 文章

## 不包含

- Vite 插件自动监听 Markdown 变更 — 后续添加
- 页面预渲染 — 下个 task
