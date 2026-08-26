# Soln 题解分类

## Goal

为博客新增「题解」分类（frontmatter `category: Soln`），用于发布算法题解（LC / CSP 等）。题解文章不出现在首页列表（含分页），以 `/category/Soln` 分类页为主要入口；其余站内入口（归档、标签、搜索、相关推荐）保留可见。RSS 订阅排除题解，搜索引擎收录保留。

## Confirmed Facts（代码勘察所得）

- 数据流：`content/posts/*.md` frontmatter → `scripts/build-posts.js` → `content/posts/posts.json`（元数据）+ `*.html`（正文）；前端各页面经 `__BLOG_DATA__.posts` 自行过滤
- 分类配置唯一源为 `src/config.js` 的 `SITE.categories`（`[['全部', null], ['技术', 'Tech'], ['随笔', 'Life']]`），改此即可让侧边栏 / 分类页 / 计数生效
- `scripts/static-renderer.js`（SSG 分类路由）与 `scripts/build-seo.js`（sitemap 分类列表）存在硬编码 `['Tech', 'Life']`，与本需求直接相关，需同步并改为配置驱动（消除重复）
- 题解写作基建已存在：`Templates/problem-post.md`（fold 题干 / 思路 / 解法 / 复杂度 / 易错点）与 `ProblemMeta` 组件（source/difficulty/url 信息条），均与分类无关、无需改动
- 现有 12 篇已发布文章均为 Tech 知识笔记（ML / AG 系列），无题解文章，**无需迁移**
- 发布入口模板 `Templates/problem-post.md` 当前默认 `category: Tech`

## Requirements

1. `src/config.js`：`SITE.categories` 增加 `['题解', 'Soln']`；新增首页隐藏分类配置（如 `SITE.homeExcludedCategories = ['Soln']`），作为「首页排除」的唯一判断源，前端不得散落字面量
2. 首页（`/` 及 `/page/N`）列表与分页排除 `category` ∈ 隐藏分类的文章；`/?category=Soln` 旧式查询参数语义一致（同样排除）
3. 侧边栏（`Sidebar.jsx`）：分类区块只列具体分类（技术/随笔/题解），**不显示「全部」入口**（回首页靠左上 logo）；各分类按 posts.json 计数，「题解」计数正确
4. 其余站内入口**不排除**：归档页、标签页、搜索索引（`build-search-index.js` 生成）、文章页相关推荐 / prev-next（`PostEnd.jsx`）
5. 分类页 `/category/Soln` 正常渲染（SSG 与 dev SPA 均可用）；`static-renderer.js` 分类路由列表由 config 动态生成
6. `scripts/build-seo.js`：`feed.xml` 排除题解文章；`sitemap.xml` 保留题解文章页并新增 `/category/Soln`；IndexNow / 百度推送保留题解 URL
7. `Templates/problem-post.md`：默认 `category` 改为 `Soln`（含注释说明）
8. 构建管线全绿：`npm run build` 全程（posts → og → vite → ssg → seo → search-index）不报错

## Acceptance Criteria

- [ ] `src/config.js` 含 `['题解', 'Soln']` 与首页隐藏分类配置；前端过滤只引用该配置
- [ ] 侧边栏分类区块只列具体分类（无「全部」项），「题解」计数正确
- [ ] 首页 `/` 与 `/page/N` 列表不含任何题解文章（以临时 draft 题解文章验证）
- [ ] `/category/Soln` 展示全部题解文章；侧边栏「题解」计数正确、「全部」计数不含题解
- [ ] 归档 / 标签 / 搜索 / 相关推荐中可见题解文章（未误伤）
- [ ] `feed.xml` 无题解 entry；`sitemap.xml` 含 `/category/Soln` 且含题解文章 URL
- [ ] `static-renderer.js`、`build-seo.js` 不再硬编码分类列表
- [ ] `npm run build` 通过，`git diff` 无意外改动

## Out of Scope

- 现有 Tech 文章迁移到 Soln
- 按题源平台（LC / CSP）子分类或筛选
- 题解专属列表样式 / 布局改动
- 搜索引擎收录屏蔽（按用户决定保留收录）