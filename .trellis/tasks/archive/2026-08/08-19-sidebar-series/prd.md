# 侧栏系列区块

## Goal

桌面端右侧栏新增「系列」区块：展示博客全部系列（名称 + 篇数），点击进入已存在的 `/series/:slug` 筛选页，让系列成为与分类/标签并列的内容入口。

## Scope

- 只改桌面端侧栏（`Sidebar.jsx` + `Sidebar.module.css`）；移动端侧栏本已隐藏，不新增移动端系列入口。
- 不新增路由、不改 posts.json/数据链路（系列从现有 posts 提取）。
- 不调整分类/标签区块。

## Requirements

1. 系列数据从 posts 动态提取：`series` 字段非空去重（与 tags 同法）。
2. 排序：按系列内最新文章日期**降序**（活跃系列靠前），不采用字母序。
3. 条目：系列名 + 篇数（muted 小字）；点击跳 `/series/<encodeURIComponent(name)>`。
4. 当前高亮：位于对应系列筛选页时高亮该条目（与分类高亮一致）。
5. 区块位置：分类 → 系列 → 标签。
6. 无任何系列时该区不渲染（不显示空标题）。

## Constraints

- 复用现有组件/样式语言：`catLink` 风格条目、`heading` 标题、muted 色。
- CSS Modules 规范；不引入新依赖；无运行时 fetch。
- 移动端行为不变（≤768px 侧栏整体隐藏）。

## Acceptance Criteria

- [ ] 桌面端侧栏显示「系列」区：3 个系列（CS229 机器学习 7、图形学 2、算法 1），排序按最新文章日期降序（实测：CS229 → 算法 → 图形学，因算法最新文章 07-18 晚于图形学 02-06）。
- [ ] 点击系列条目跳转 `/series/<slug>`，系列页按 seriesIndex 列出全部文章。
- [ ] 高亮匹配逻辑与分类同款（`location ===`）；侧栏仅在首页渲染（`Layout sidebar={isHome}`），分类/系列筛选页视图无侧栏——与现有分类行为一致。
- [ ] （构造验证）无系列数据时不渲染系列区。
- [ ] 亮/暗主题、桌面端无样式冲突；`npm run build` 通过；移动端侧栏仍隐藏、无溢出。

## Notes

- 轻量任务：仅侧栏组件 + 样式；产出 `design.md` + `implement.md`。
- 调研依据：`research/series-research.md`。