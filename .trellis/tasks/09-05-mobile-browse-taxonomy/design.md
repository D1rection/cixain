# 移动端标签与系列浏览入口 — 技术设计

## 1. Current State

- `NavBar` 在移动端隐藏文字，仅展示图标；背景按钮被隐藏，因此当前展开菜单共有 6 个入口：主页、归档、关于、GitHub、搜索、主题。
- `Sidebar` 在 `<=768px` 时整体隐藏。分类、系列、标签的聚合统计都写在 `Sidebar.jsx` 内，因此移动端失去全局浏览入口。
- 具体标签仍可从文章卡片和文章页进入；具体系列只在系列文章的目录块中出现。这些是上下文入口，不是完整索引。
- `Layout` 仅在首页挂载侧栏，筛选页本身也没有横向切换到其他分类、系列或标签的入口。

## 2. Decision

新增一个内容级一级入口「浏览」，仅在移动端替换 GitHub；点击后导航到独立 `/browse/` 页面。

移动端一级入口：

```text
首页 / 归档 / 浏览 / 关于 / 搜索 / 外观
```

不采用以下方案：

- 将标签和系列分别加入菜单：会突破 6 个入口约束，并遗漏分类。
- 把分类、系列、标签直接展开在导航下拉层：内容增长后会产生过高面板和嵌套滚动。
- 只在搜索浮层空状态展示：入口语义不明确，浏览内容的可发现性依赖用户先理解“搜索”。
- 将归档改造成多标签页索引：保留 GitHub 的代价是弱化“归档”语义，并增加一级页面内部切换成本。

GitHub 是低频外部目的地，且已存在于关于页；桌面空间充足时继续保留，因此能力没有被删除。

## 3. Information Architecture

`/browse/` 页面按从宽到窄的层级排列：

1. 分类：站点预先定义的宽口径内容类型；
2. 系列：有明确阅读顺序的专题内容；
3. 标签：粒度最细的交叉主题。

页面结构：

```text
浏览内容                         N 篇文章

分类
[技术 N] [随笔 N] [题解 N]

系列
[系列名                         N 篇 >]

标签
[#标签 N] [#标签 N] ...
```

当前数据量较小，三组全部展开。标签使用统一字号和触控高度，热度由排序与计数表达，避免移动端小字号标签难以点击。

## 4. Data Boundary

把 `Sidebar.jsx` 内部的分类计数、标签统计、系列统计抽取为无副作用的共享工具，例如：

```text
buildTaxonomy(posts, categories)
  -> categories: [{ label, slug, count }]
  -> series: [{ name, count, latest }]
  -> tags: [{ name, count, tier }]
```

`Sidebar` 与 `Browse` 同时消费该结果，保证：

- 计数只有一个实现；
- 排序规则不会在桌面和移动端漂移；
- SSR 和浏览器端得到确定性一致的 DOM 顺序；
- 未来调整排序或热度分档时只修改一处。

该工具只接受文章元数据，不读取 DOM、location 或浏览器 API，便于直接测试。

## 5. Navigation Rendering

`NavBar` 保留单一导航组件，但使用响应式可见性区分：

- Desktop：现有首页、归档、关于、GitHub、搜索、背景、主题保持不变；浏览入口隐藏。
- Mobile：GitHub 与背景入口隐藏；浏览入口显示；最终仍为 6 个入口。

移动端 `.links` 从 `space-evenly` 改为 6 列等宽网格。每个入口包含 18px 图标和短文字标签，最小触控高度 44px；320px 宽度下每列仍约 48px，可容纳两字标签。

状态行为：

- 汉堡按钮提供 `aria-expanded` 和 `aria-controls`；
- 展开的内容是普通站点导航 disclosure，不使用应用菜单的 `role=menu`；
- Escape、路由导航和点击品牌均关闭菜单；
- 路由变化时同步关闭，覆盖浏览器前进/后退场景；
- 当前路由使用 `aria-current="page"` 与现有 accent 状态。

## 6. Route and Static Generation

新增客户端路由：

```text
/browse/ -> Browse
```

同时更新：

- `scripts/static-renderer.js`：加入浏览页 route/data/meta 分支，输出 `dist/browse/index.html`；
- `scripts/build-seo.js`：加入 `/browse/` sitemap URL；
- 页面标题与描述：`浏览 — Cicada's blog`，描述聚焦按分类、系列与标签浏览文章；
- canonical 继续使用 `routePath()` 的目录型尾斜杠规则。

浏览页只需要全量文章元数据，与首页和归档页的数据形态一致，不需要正文。

## 7. Styling

- 复用现有颜色、边框、像素字体和 accent 状态，不引入新视觉体系。
- 分类采用三列或自适应网格；系列采用全宽列表行；标签使用可换行 chip。
- 页面主宽度与归档/筛选页一致，移动端左右边距沿用 `Layout`。
- 空分类可以显示 `0`，保持 `SITE.categories` 的完整信息；系列或标签为空时隐藏对应区块并提供简短空态。

## 8. Accessibility and Touch

- 一级入口、分类、系列和标签触控目标以 44px 为设计目标。
- 图标不是唯一名称来源；保留可见文字与明确 accessible name。
- focus-visible、pressed、active 三种状态可区分。
- 浏览页使用语义化 `main / header / section / h2 / a`，计数作为链接可读文本的一部分。

## 9. Compatibility, Rollout, Rollback

- 无数据迁移、无内容格式变化、无新依赖。
- 新页面和移动端入口可以一起发布；若需回滚，只需撤回浏览路由/页面并恢复移动端 GitHub 可见性，现有分类、标签、系列页面不受影响。
- 桌面端是回归重点：共享统计抽取不能改变现有侧栏顺序和计数。

## 10. Research Basis

- Material Design 将 5 个以上一级目的地视为抽屉导航适用场景，并强调按重要程度排序；本设计保留现有折叠导航，但用内容入口替换低频外链。
- W3C Disclosure Pattern 要求展开按钮同步 `aria-expanded`，可用 `aria-controls` 指向受控内容。
- WCAG 2.2 AA 的最低指针目标为 24×24 CSS px；Apple 通用建议为至少 44×44pt。本设计采用 44px 目标，优于当前 32px。

详见 `research/mobile-taxonomy-navigation.md`。
