# 文章父子关系

## Scope / Trigger

修改文章 parent、子文章入口、文章列表范围、共享元数据、搜索或 SEO 时适用。子文章属于 post，与 fragment 分离。

## Signatures

- `validatePostHierarchy(sources: Map)` 返回 `{parentIds, invalidIds, diagnostics}`；来源含 file/state/parent，fragment 另含 hasParent。
- `rootPosts(posts)` / `isRootPost(post)` 选择无 parentId 的 post（兼容旧数据无 kind）。
- `directChildPosts(posts, parentId)` 按日期升序、同日按 slug 的非 locale 比较排序；`parentPost(posts, post)` 按 namespaced ID 查询直属父文章。
- `ChildArticles({articles})` 挂在 BlogPost 的 RevisionReader 后，以当前文章 ID 为 key。

## Contracts

frontmatter `parent: "post:文件名"` 仅指向直属普通文章，未写/null/空白为顶层。不解码，不按标题推断，不接受 fragment、URL、wiki、数组或锚点。生产只校验可见来源，未发布节点被引用时诊断；开发允许原本可见的有效草稿树。

所有可见文章元数据携带 `parentId: string|null`。子文章的 category/series/seriesIndex 输出 null；模板不含这些字段，页面不显示分类/系列位置。parent 不参与 refs/backlinks，也不进入历史正文哈希。标签与日期不继承；子文章头部 TagChip linked=false，标签为静态文字，避免独有标签指向未生成汇总页。

posts.json、registry 与所有正常 SSG 页面共享 posts 必须保留完整可见文章元数据，不能为首页隐藏而删除子文章。仅当前页内联正文；分类/标签/系列页面也保留完整共享 posts，组件自己过滤。

首页/分类/标签/归档/浏览/系列/计数/相关推荐/上下篇/Atom 采用顶层文章范围。顶层 showOnHome=false 仍仅控制首页；子文章 showOnHome=true 也不能进入首页。子文章页保留分享和版权，隐藏全局上下篇与推荐。OG 默认站点计数只统计顶层，但每篇公开子文章仍生成独立 OG、历史、详情、正文资源与 sitemap 条目。

子文章列表默认折叠，只有标题链接，显示直接子文章数量；空列表隐藏，无修订历史时仍能显示。切换文章重置折叠，修订比较不改变当前关系。返回父文章仅显示直属父文。链接使用 contentUrl（编码 slug、尾斜杠），正文 fetch 使用 BASE_URL 并按 slug 隔离/取消请求。

搜索 schemaVersion=1 的 post 条目可选增加 parentId/parentTitle；旧索引兼容，fragment 不添加关系字段。显示“提炼自：父标题”，不改变排序和键盘/虚拟列表契约。

## Validation & Error Matrix

| 场景 | code | 生产 | 开发 |
| --- | --- | --- | --- |
| parent 类型/格式错误 | invalid-post-parent | 写内容产物前失败 | 告警并排除节点及后代 |
| 可见碎片含 parent（即使为空） | unsupported-fragment-parent | 同上 | 同上 |
| 缺失父文 | missing-post-parent | 同上 | 同上 |
| 父文未发布/祖先关系无效 | unpublished-post-parent | 同上 | 同上 |
| 自引用 | self-post-parent | 同上 | 同上 |
| 多节点循环 | cyclic-post-parent | 同上 | 同上 |

诊断含 sourceFile、field=parent、raw、targetId、reason、hint。开发排除必须同步 registry、标题表、正文候选集合；不能清空 parentId 后把错误子文章变为顶层。遍历为迭代式，每节点结算一次，支持深树。

## Good / Base / Bad Cases

- Good：B parent=post:A，C parent=post:B；A 只列 B，B 可返回 A 并列 C。
- Base：旧文章无 parent，输出 parentId=null，其原有分类、系列、首页设置保持原样。
- Bad：用 fragment:A 作父亲，或用系列同名、正文双链推断归属。

## Tests Required

`npm run test:content` 与 `npm run test:revisions`。关系测试见 tests/content/post-hierarchy.test.mjs，覆盖深链、循环、发布、写入门禁、同名类型、元数据归一与稳定排序。

完整构建在隔离副本运行 `env -u CI -u BAIDU_TOKEN npm run build`，避免修改用户的 content/public 和意外推送 URL。验证全页面 posts 集合一致、未内联其他正文，子文不进入 feed/列表但有独立资源与搜索条目。浏览器覆盖直接访问与分类/系列/碎片起始的 SPA 跳转、默认折叠、历史比较、中文 slug、非根 BASE_URL、窄屏与键盘。

## Wrong vs Correct

- Wrong：在 posts.json 或分类 route.data.posts 中提前只保留顶层/同分类文章，导致后续导航丢失父子关系。
- Correct：共享数据始终完整，具体展示消费 rootPosts 或 directChildPosts。
- Wrong：子文章复用 fragment 类型，或把 parent 加入正文反向引用。
- Correct：post 的显式 parent 关系与 fragment/正文引用各自独立。
