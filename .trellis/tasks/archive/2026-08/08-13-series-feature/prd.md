# 文章系列功能

## Goal

为博客引入「系列」概念：frontmatter 显式声明 `series`（字符串，key = 显示名）与可选 `seriesIndex`（系列内顺序），实现系列聚合页、文章页顶部面包屑、文章底部系列内导航。标题命名不参与系列识别（以字段为准）。

## Requirements

- frontmatter 新增可选字段：
  - `series: <名称>` —— 系列名（字符串，同时作为分组 key 与显示名，可中文）；不写 = 非系列文章
  - `seriesIndex: <数字>` —— 系列内显式顺序，可选；缺省按日期
- 系列内排序：`seriesIndex` 优先，无则按日期；「第 N 节」= 排序后的位置序号（1 起，不依赖编号连续性）
- 系列页：新路由 `/series/<name>/`，复用 tag 页的卡片布局与分页
- 文章页顶部面包屑：「系列名 · 第 N 节」，可点击跳系列页；非系列文章不显示
- PostEnd 分流：
  - 系列文章：`上一篇/下一篇` 替换为系列内 `上一节/下一节`（仅指向系列内相邻篇）；`相关推荐` 过滤掉同系列文章
  - 非系列文章：维持现状（全局上下篇 + 全量相关推荐）
- 现有文章迁移（9 篇）：
  - CS229 机器学习：ML1-1 ~ ML1-7 → seriesIndex 1-7
  - 图形学：C1, C2 → seriesIndex 1, 2
  - 算法：AG1 → seriesIndex 1
- 写作模板（Templates/new-post.md）加 series/seriesIndex 示例
- spec 更新（content-pipeline.md / component-guidelines.md）

## Acceptance Criteria

- [ ] 文章 frontmatter 声明 series 后，posts.json 含 series/seriesIndex 字段
- [ ] `/series/CS229 机器学习/`（URL 编码）渲染该系列全部文章，按 seriesIndex 顺序
- [ ] 系列页无文章时优雅降级（404 或空态，与 tag 页行为一致）
- [ ] 系列文章页顶部显示「系列名 · 第 N 节」面包屑，点击跳系列页
- [ ] 系列文章 PostEnd：上一节/下一节只在系列内；相关推荐不含同系列文章
- [ ] 非系列文章 PostEnd 行为与改动前完全一致（回归对照）
- [ ] 系列内上一节/下一节在系列首篇/末篇时正确隐藏对应方向
- [ ] 无 seriesIndex 的系列文章按日期排序
- [ ] 9 篇现有文章迁移后：CS229 系列 7 篇、图形学 2 篇、算法 1 篇，各系列顺序正确
- [ ] 模板与 spec 更新完成

## Notes

- 涉及文件：scripts/build-posts.js、src/App.jsx、src/pages/FilteredList.jsx、src/pages/BlogPost.jsx、src/components/PostEnd.jsx（+ .module.css）、Templates/new-post.md、spec、9 篇文章 frontmatter
- 技术设计见 design.md，执行计划见 implement.md
