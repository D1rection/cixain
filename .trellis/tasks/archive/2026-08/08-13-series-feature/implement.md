# 文章系列功能 — 执行计划

## 步骤

1. **数据层**（scripts/build-posts.js）
   - buildPosts 循环内解析 `series` / `seriesIndex` 进 posts 对象
   - 重建，确认 posts.json 出现新字段

2. **系列页**（src/App.jsx + src/pages/FilteredList.jsx）
   - App.jsx 加 `/series/:slug` 路由
   - FilteredList 加 type='series' 分支（过滤 + 排序 + 标题）

3. **面包屑**（src/pages/BlogPost.jsx + PostContent.module.css）
   - 系列排序工具函数（新建 src/lib/series.js 或就近定义）
   - meta.series 时 h1 上方渲染面包屑

4. **PostEnd 分流**（src/components/PostEnd.jsx）
   - 系列文章：prev/next → 系列内相邻篇（提示文案改 `$ cd series`）；related 过滤同系列
   - 非系列：行为不变

5. **迁移 9 篇 frontmatter**
   - 脚本或逐篇追加 `series` / `seriesIndex`（按标题编号映射）
   - 逐篇核对 seriesIndex 与标题编号一致

6. **模板与 spec**
   - Templates/new-post.md 加 series/seriesIndex 示例
   - spec：content-pipeline.md（frontmatter 字段）、component-guidelines.md（PostEnd 分流/面包屑）

## 验证（对应 prd.md Acceptance Criteria）

- `node scripts/build-posts.js` 后检查 posts.json：9 篇有 series，值正确
- 系列页 `/series/CS229%20%E6%9C%BA%E5%99%A8%E5%AD%A6%E4%B9%A0/` 顺序 = seriesIndex
- dev 预览：系列文章面包屑、PostEnd 上一节/下一节与相关推荐过滤；非系列文章对照（回归）
- 首篇/末篇无越界方向；无 seriesIndex 文章按日期排
- 迁移核对：逐篇 grep frontmatter

## Review Gates

- 全量验证通过 → 用户 dev 预览 → 用户确认后提交
- push 前询问

## Rollback

- 还原代码文件（build-posts.js / App.jsx / FilteredList / BlogPost / PostEnd）+ 回滚 9 篇 frontmatter（git checkout 单文件）即完全回退
