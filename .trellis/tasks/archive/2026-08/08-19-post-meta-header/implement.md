# Implement — 文章头部 meta 区执行计划

## 1. 实施步骤

1. **build-posts.js**：
   - 顶部 `import { spawnSync } from 'node:child_process'`
   - 新增 `gitCommitDate(file)` 工具：`git log -1 --format=%cI -- <file>` → ISO 归一化 `YYYY-MM-DD`；stdout 空/异常 → null
   - `posts.push` 注入 `updated: gitCommitDate(file)`（619-629 行 meta 构造处）
   - 移除 frontmatter 方案（无 updated 读取）
2. **BlogPost.jsx**：
   - 头部容器改 `<header>`，引入 `styles from '../pages/BlogPost.module.css'`
   - meta 行：日期 +（updated 且 ≠ 发布时间时）` · 更新于 X` +（有分类）` · 分类`
   - TagChip 行：`meta.tags` 非空时渲染，`param="tag"`
   - 移除原内联 style
3. **新增 src/pages/BlogPost.module.css**：design.md 第 3 节参数 + 换行/折行规则（design 第 5 节）。
4. 不写内容文件（updated 纯自动，无手工字段）。

## 2. 自验（gate 1）

- `npm run build` 通过；post.json 抽查：所有已提交文章都有 updated 值（= git 提交日期）
- dev 浏览器：
  - 与发布日期同日的文章：无"更新于"（如 2026-08-18 篇，提交日=发布日）
  - 不同日的文章：显示"更新于 YYYY-MM-DD"（如 2026-01-13 篇 → 更新于 2026-08-13）
  - 标签 chip 渲染与跳转 `/tag/...`
  - 头部内联 style 已消失（元素检查）

## 3. 回归（gate 2，含桌面/移动）

- **视口三档**：375px / 768px / 1440px——meta 行无横向溢出、标签 chip 折行自然、无字重叠
- 亮/暗双主题头部 muted 可读性对比
- 列表页/PostEnd 相关推荐不受影响（字段只增不改）

## 4. 完成后

- Phase 3.3 判断：spec 是否记录"文章头部 meta 结构"约定（若形成模式则补 typography 或新 meta 章节）