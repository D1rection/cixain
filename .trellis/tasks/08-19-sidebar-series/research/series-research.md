# 侧栏系列区块设计调研

## 一、现状

- **侧栏（Sidebar.jsx，220px，≤768px 隐藏）**：目前只有「分类」（SITE.categories 静态配置）+「标签」（posts 提取去重、字母序）。
- **系列数据**：文章 frontmatter `series`（名称）+ `seriesIndex`；`src/utils/series.js` 的 `sortSeries` 已支持按 seriesIndex 优先排序。
- **系列页面已存在**：`/series/:slug` 路由（App.jsx）+ `FilteredList type="series"`（sortSeries 过滤、badge「系列」、篇数展示），链接目标完备，无需新增路由。
- 系列数据实测：CS229 机器学习（7 篇）、图形学（2 篇）、算法（1 篇）。
- 系列目前在 UI 的呈现：文章页 TOC 侧边（series prop）、文末 PostEnd 系列导航（`$ cat series/prev|next`）。侧栏无系列入口——空白点。

## 二、设计决策

1. **数据来源**：`[...new Set(posts.flatMap(p => p.series).filter(Boolean))]`（与 tags 同法），无新数据链路。
2. **排序**：按系列内**最新文章日期降序**（活跃/最新系列靠前，比字母序更适合内容导航；tags 保持字母序不动）。
3. **条目形态**：与「分类」条目一致的简洁文本行 + 篇数（muted 小字），点击链 `/series/<encodeURIComponent(系列名)>`。
4. **当前高亮**：位于该系列筛选页时高亮（复用 catActive 模式）。
5. **区块位置**：分类 → 系列 → 标签（静态 → 中 → 高频），系列在前端数据稳定且已配页面，放中间顺位自然。
6. **移动端**：侧栏整块隐藏（现有行为），不引入移动端系列导航（范围克制）。

## 三、验收点

- 桌面端（>768px）侧栏显示系列区，含 3 个系列与篇数
- 点击跳到 `/series/CS229%20机器学习` 等，页面正常列出该系列全部文章（按 seriesIndex 排序）
- 系列筛选页高亮对应条目；无系列数据时不渲染该区（不显示空标题）
- 亮/暗主题一致；不与分类/标签样式冲突