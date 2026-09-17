# 文章首页可见性设计

状态：已确认并进入实现；RSS 与首页属性独立。

## 字段契约

```yaml
category: Soln
showOnHome: false
```

`showOnHome` 是可选 YAML boolean。缺省为 true，false 表示从首页文章列表排除。category 仅定义分类，draft 定义发布状态。首页可见性不代表访问权限。

构建期在 `scripts/build-posts.js` 解析 frontmatter 后校验：只有未定义或 boolean 合法；null、空值、字符串、数字均报错，包含文件名与字段名，以非零状态结束构建。校验放在草稿/未来日期过滤前，使 dev 与生产规则一致。合法值规范化为 `data.showOnHome ?? true`，显式写入 `posts.json`。不要使用 `Boolean(value)` 或 `value || true`。

前端采用 `p.showOnHome !== false` 的兼容读取方式，容忍旧元数据缺少字段。重新构建和部署须包含已迁移内容，旧分类隐藏规则不作为长期回退。

## 数据链路及边界

1. Markdown 属性经 build-posts 校验并写入文章元数据。
2. SSG 的 metaOnly 已透传除正文外的属性，无需再建字段白名单。
3. Home 把原分类排除条件替换为 showOnHome 判断，然后应用原 tag/category 条件、计数、分页。
4. 共享 posts、静态首页内联数据和侧栏统计保留全量已发布文章，不在构建列表阶段全局过滤。
5. FilteredList、Archive、Search、PostEnd、正文生成和 sitemap 不消费此字段。

无需增加通用可见性服务或新 UI。首页分页继续使用 `?page=N`，不引入 `/page/N` 路由。静态首屏和水合共用 Home。

## RSS：独立处理

将既有订阅排除策略命名为 `SITE.rssExcludedCategories: ['Soln']`，仅由 build-seo 使用。首页改用文章属性。这样题解允许上首页时仍不进入 RSS，普通文章首页隐藏时仍可订阅。

feed 不过滤 `showOnHome`，字段只控制首页展示。暂不引入 showInFeed 等第二个文章属性；有逐文章订阅需求再单独设计。

## 迁移与写作体验

显式补 `showOnHome: false` 的当前源文件：

- content/posts/2026-08-26-002.md
- content/posts/2026-08-27-001.md
- content/posts/2026-09-04-001.md
- content/posts/2026-09-04-002.md
- content/posts/2026-09-05-001.md
- content/posts/2026-09-06-001.md

实施前重新扫描源文件，迁移所有当时仍依赖旧规则且无显式属性的 Soln 文章；保留作者已有显式值。模板 `problem-post.md` 添加 false，`new-post.md` 添加 true，注明可省略且缺省显示。已有 new-post 用户修改须保留。

Obsidian 类型配置可合并添加 `showOnHome: checkbox`，保留现有类型，使作者通过勾选编辑。此文件当前未跟踪，实施时只做字段级合并并单独核对用户内容，不能整体覆盖。

## 文档与兼容

更新 content-pipeline、ssg-pipeline 中首页隐藏分类和 RSS 共用配置的旧说明；修正相关代码注释中的“分类页唯一入口”。不要回写历史归档任务。

源码、模板、迁移内容和生成元数据须作为一次部署发布，避免先删除分类规则使旧题解全部出现在首页。校验静态 HTML 时分别检查文章列表与 JSON 数据，不能用整页字符串搜索判断题解是否显示。

## 验证与回退

对缺省/true/false × Tech/Soln 的组合、非法类型、分页边界及静态渲染检查；临时测试内容应在隔离副本中使用，避免覆盖用户生成文件。无需扩大为全站重构。

回退需成组恢复首页规则和 RSS 配置引用；生成文件重新由对应版本构建，保留所有用户原有工作区变化。新增属性在旧代码中可被忽略，不影响正文。
