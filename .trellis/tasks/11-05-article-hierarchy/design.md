# 文章父子关系技术设计

状态：用户已评审并授权实施（2026-11-05）。

## 1. 内容边界与写作协议

子文章仍为 `kind: post`，使用 `content/posts/*.md`、现有 Markdown 编译器、修订历史与 `/blog/<encoded-slug>/` 规范地址。碎片保持 `kind: fragment`、`content/fragment/*.md`、`/fragment/<encoded-slug>/`，不参与父子树。两类内容可以继续通过正文链接互相引用。

只在子文章 frontmatter 声明直属父文章：

```yaml
title: 用自己的话理解反向传播
date: "2026-11-05"
description: 对神经网络一文中反向传播部分的归纳
parent: "post:2026-10-18-001"
draft: true
```

- `parent` 缺省、YAML null 或空白字符串表示无父文章，方便 Obsidian 模板留空。
- 非空值必须为字符串 `post:<完整原始文件名去除.md>`，trim 外侧空白后按 ID 精确匹配。不接受裸 slug、URL、wiki 语法、数组、多父节点、锚点或 `fragment:` 前缀；不做 URL 解码或标题猜测。
- `parent` 是唯一写作来源。父文章不维护 `children`，不写重复的首页隐藏配置，不增加子文章类型、根 ID 或深度字段。
- 当前 ID 由文件名产生，不是独立于文件名的 UUID。改标题不影响关系，改文件名则需要修改所有相应 `parent` 和正文引用；删除父文章前须转移、解除或删除子文章关系。
- 碎片出现 `parent` 键即诊断为不支持的字段（包括空值），避免误用普通文章模板；普通碎片未写该键不受影响。
- 分类、归档、系列不适用于子文章：不设置或继承 category/series/seriesIndex，不进入相关列表与计数，详情不展示分类或系列入口。子文章模板省略这些字段；若从普通文章模板遗留这些字段，构建时忽略并将子文章输出元数据中的 category/series/seriesIndex 归一为 null，防止向 UI 与 SEO 透传。该规则由有效 parentId 决定，不影响顶层文章原有字段。
- 标签与日期不自动继承；子文章标签用纯文字展示，避免指向不生成的子文章独有标签页；`showOnHome: true` 不能覆盖有父文章时的首页隐藏规则。
- 不限制产品层级深度；算法使用带 visited 状态的迭代遍历，避免深链递归栈溢出。

## 2. 构建数据契约

文章元数据增加 `parentId: string | null`，不把原始 `parent` 再复制成第二个对外字段：

```json
{
  "id": "post:my-summary",
  "kind": "post",
  "slug": "my-summary",
  "parentId": "post:2026-10-18-001",
  "contentUrl": "/blog/my-summary/"
}
```

顶层文章输出 `parentId: null`；旧元数据缺失字段在消费端等同 null。`posts.json` 继续保留本次所有可见 post（包含子文章），不混入 fragment。`registry.json` 继续包含可见 post + fragment，文章关系字段自然透传，碎片不增加 parentId。

建议新增两处小模块：

- `scripts/lib/post-hierarchy.js`：解析声明、结合全量来源/可见集合验证、形成可见文章的 parentId 映射与诊断。
- `src/utils/postHierarchy.js`：Node 与客户端共用的纯选择器，如 `isRootPost`、`rootPosts`、`directChildPosts`、`parentPost`。只接收 post 元数据，不调用浏览器 API。

直接子文章按 date 升序，同一时刻按 slug 的 locale-independent 字符串比较排序；不使用 updated，避免编辑打乱顺序。第一版不新增手动顺序字段。关系反向索引可用 useMemo 根据共享 posts 建立，列表不内联子文章正文，也不持久化完整嵌套对象或全部祖先链。

### 校验与发布阶段

在 `buildPosts()` 预扫时保存文章原始 parent、来源文件和发布状态；在编译正文前完成本次可见节点的关系检查，随后复用现有引用检查与最终写文件门禁。

1. 全量来源索引区分“不存在”和“存在但未发布”；可见索引沿用原有 post/fragment 的草稿、未来日期及必填字段规则。
2. 对本次可见文章检查 parent 格式、目标类型、目标存在性和发布状态；沿父链遍历，验证所有祖先并报告完整循环路径。
3. 生产草稿/未来文章不因被 parent 引用而发布。单独未发布草稿不参与发布图校验；可见文章引用它时，报告未发布祖先。
4. 开发模式可预览原本允许的有效草稿链，未来文章仍排除；无效关系节点及依赖它的后代告警并从本次预览集合排除，不能清空 parentId 后将其当作顶层文章。
5. 开发剔除必须同时更新可见 registry、标题表和编译候选集合，然后再解析正文链接，避免列表、链接检查与正文产物出现不同可见性。
6. 诊断包含 code、sourceFile、`field: parent`、raw、targetId、reason、hint，能获取时附源码位置。生产有错误则在写 HTML/JSON/anchor-index 前失败；不擅自修复绑定。

建议错误码：`invalid-post-parent`、`unsupported-fragment-parent`、`missing-post-parent`、`unpublished-post-parent`、`self-post-parent`、`cyclic-post-parent`。未发布祖先诊断指出导致不可见的祖先与链路。复用现有 reportContentDiagnostics 形状，错误信息明确指出 parent 字段。

关系边不加入正文 refs/backlinks，也不自动触发原文章修订版本：正文引用关系与作者归属关系保持独立。无需修改 Markdown 编译语义或升级 CONTENT_COMPILER_VERSION；若实现最终改变编译输出，另按历史缓存契约处理。

## 3. 页面交互

在 `BlogPost.jsx` 中保留以下顺序：

1. 标题、日期、标签；分类仅在顶层文章显示。
2. 子文章的“返回父文章：<标题>”链接（顶层文章不显示）。
3. 现有 RevisionReader（无历史时仍可为空）。
4. 新的 ChildArticles（无直接子文章时返回 null）。
5. 现有目录、正文和文章底部模块。

ChildArticles 独立于 RevisionReader，不修改版本选择状态、不共用展开状态。模块位于修订历史整个组件（包含比较状态提示）之后。

- 折叠行文案：`子文章 · N 篇`，默认折叠；展开后每行只有文章标题与跳转链接，不显示摘要、日期或多层树。
- 视觉复用修订历史的窄宽度、小字号、强调色箭头和轻量间距，但有独立 JSX/CSS Module，避免借用私有类名造成耦合。
- 使用具有 aria-expanded/aria-controls 的按钮、唯一面板 ID、语义列表和真实链接；支持键盘、focus-visible、标题换行及 reduced motion。
- 组件以当前文章 ID 作为 key（或显式按 ID 重置），SPA 切换时恢复折叠；不能沿用上一页展开状态。
- 修订比较仅改变正文，子文章列表始终对应当前发布关系，不回退历史 frontmatter。
- 链接复用 `contentUrl`/`routePath`，兼容 VITE_BASE_URL、尾斜杠与中文 slug 编码。
- 第一版只返回直属父文章，不增加完整面包屑或树导航。子文章自身的目录、分享、版权与历史仍正常。

## 4. 列表范围与完整共享数据

统一区分“所有可见文章”与“顶层文章视图”，不能在 posts.json、页面 Context 或 registry 的入口删掉子文章。

| 消费入口 | 范围与规则 |
| --- | --- |
| 首页 | 顶层 + 原有 showOnHome/分类等过滤，过滤后分页 |
| 分类/标签/归档/浏览及桌面移动分类计数 | 顶层；计数与列表同源 |
| 系列列表、侧栏系列、sortSeries、文章系列位置 | 顶层；子文章无系列归属或系列入口，即使遗留 series 也不占系列位置 |
| 普通文章底部上下篇和相关推荐 | 候选只取顶层 |
| 子文章底部 | 隐藏上下篇/相关推荐，保留分享和版权；由顶部返回父文导航 |
| 父文章子列表 | 当前文章直接子节点，不受子文章 showOnHome 设置干扰，不依赖分类或系列 |
| 站内搜索 | 所有公开 post（含子文章）与 fragment |
| post 详情 SSG、正文复制、OG、修订历史 | 所有公开 post；子文章不输出 category/series 对应分类、系列元信息及结构化数据 |
| sitemap 与现有搜索引擎提交候选 | 所有公开详情；标签/系列路由只从顶层派生 |
| RSS/Atom | 顶层，再应用已有 draft/分类排除、排序、条数与全文限制 |

`static-renderer.js` 当前分类/标签/系列 route.data.posts 仅有筛选子集。所有正常页面应统一注入完整 `posts.map(metaOnly)`，具体页在组件内过滤；路由生成需要的标签/系列名称由顶层集合派生。404 保留既有空数据回退，不扩展本次范围。

这一步确保从分类页、子文章页、碎片页进入任意父文章，均能找到完整父子关系，并让侧栏计数与直接访问一致。所有页面仍只内联当前页面正文，不能为解决关系问题引入全站正文或运行时全量元数据请求。

## 5. 搜索

搜索继续使用 registry 生成全量公开内容索引，不改成碎片集合，不添加“子文章”内容类型。

`build-search-index.js` 对 post 条目附加可选的 `parentId`、`parentTitle`，由已验证 registry 查询父标题，不依赖 parent 原始字符串再次解析。不为 fragment 写入关系字段。SearchResultsList 在已有摘要/标签之外增加一句 `提炼自：<父文章标题>`；该句不是第二个交互链接，不改变既有键盘活动项契约。

新增字段是可选的，既有 schemaVersion=1 与旧索引可兼容；字段缺省时隐藏父标题说明。不调整搜索排名、匹配范围、虚拟列表策略或内容类型徽章。搜索展示行高度变化必须验证现有动态测量、尾项可达与窄屏表现。

## 6. 写作说明、兼容与回滚

- 新增 `docs/writing-child-articles.md`，说明绑定、与碎片区别、多级示例、发布祖先、解除归属和重命名。
- 优先新增 `Templates/new-child-post.md`（默认 draft:true，parent 留空并提示发布前填写，不含 category/series/seriesIndex）；若在普通模板增加可选 parent，也必须合并用户现有模板修改，不能覆盖。
- 旧文章无需迁移，未写 parent 的行为保持原样；现有 fragment 正文、日期、URL 和反向引用规则不变。
- 新增关系后全量重建文章、搜索、SSG、SEO 与历史资源，清除旧 dist 后再部署，避免过去顶层身份残留。
- 内容层可移除 parent 使文章恢复顶层；若回滚功能代码，应同时移除/保管这些声明，旧代码忽略 parent 会把原子文章重新放入列表。安全回滚使用功能上线前的完整构建产物。
- 实现时同步更新 post-hierarchy 及 content-pipeline、content-validation、ssg-pipeline、component-guidelines 中对应契约；构建验证在隔离副本进行。

## 7. 已知成本与评审默认值

共享文章元数据量维持线性增长，反向索引在需要时建立；不存递归树避免重复数据。父文章改名需要人工修正关系，由构建诊断发现。分类、归档、系列不适用于子文章，以及默认折叠与位置，均为用户明确要求；其余全站列表默认排除子文章、搜索保留且标记父文章、子列表日期升序作为本方案默认值，可在评审时调整。
