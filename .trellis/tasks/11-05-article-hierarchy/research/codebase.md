# 仓库调研记录（2026-11-05）

## 已验证事实

- `scripts/build-posts.js:903` 的 buildPosts 接受 directory，用于隔离内容测试；预扫 post 与 fragment 后分别维护 allContent/registry，正文引用校验先于最终 outputs 写入。可沿此位置增加关系预扫与门禁。
- post ID 已为 `post:<slug>`；fragment ID 已为 `fragment:<slug>`。posts.json 只有文章，registry.json 合并文章与碎片，不能用 fragment 或 showOnHome 代替父子关系。
- showOnHome 只在首页过滤，无法表达全局附属文章范围。文章类别、RSS 排除、系列和引用有各自独立语义。
- `src/pages/BlogPost.jsx` 的 header 内顺序为标题/元信息/标签/RevisionReader。目录与正文在 header 后。新增列表应作为 RevisionReader 后的兄弟组件。
- `RevisionReader.jsx` 默认 expanded=Boolean(compareId)，无修订直接返回 null，比较状态属于该组件。子文章应独立折叠，不与比较状态共用。
- `src/utils/series.js`、`taxonomy.js`、Home/FilteredList/Archive/Browse/Sidebar/PostEnd 都直接消费 posts，须逐一核对列表与计数范围。
- `scripts/static-renderer.js` 的首页/文章/碎片已带完整文章元数据；分类/标签/系列页 data.posts 目前只带筛选子集。客户端 Context 不随导航替换，所以必须补齐这些起始页的共享数据。
- `scripts/build-search-index.js` 对 registry 按 kind 读 posts 或 fragment 内容，输出字段是显式白名单；新增 parentId 不会自动进入搜索索引，需显式添加父标题上下文。
- `SearchOverlay.jsx` 接受 schemaVersion=1 并校验基本字段；可选关系字段可保留向后兼容。SearchResultsList 支持动态行高，额外父标题需验证虚拟列表行为。
- `scripts/build-seo.js` 将所有文章加入详情 sitemap/推送并单独生成标签/系列路由与 Atom。详情与列表/feed 必须采用不同集合。
- `tests/content/content.test.mjs` 已使用临时目录、buildPosts 及原生 node:test；适合增加关系图与发布门禁测试。
- package.json 没有 lint 或 typecheck 命令；现有自动检查是 test:content、test:revisions 和完整 build，不应虚构检查已通过。

## 工作区约束

调研前 git status 已有 Obsidian 配置/插件删除、Templates/new-post.md、Templates/callout.md、posts.json、feed、sitemap 与 OG 等未提交改动。本轮只创建本任务文档；实现或隔离验证时不要覆盖、恢复、提交这些已有修改。

构建与 SEO 脚本会写回 content/public；build-seo 还能读取环境中的推送凭据执行搜索引擎提交。完整构建验证应在包含当前源码的临时副本进行，使用 `env -u CI -u BAIDU_TOKEN npm run build`。当前脚本通过非空 CI 环境变量触发提交（字符串 false 也会触发），IndexNow key 来自 public 下的 key 文件，并不读取 INDEXNOW_KEY；仅清空百度凭据无法关闭 IndexNow。

## 需求来源

- 用户原始意图：自主提炼每篇原文，归纳文章可继续嵌套，首页隐藏，只在对应文章下展示列表。
- 用户位置修正：跟在已有修订历史列表下面，不增加文末模块。
- 用户类型约束：不要和之前碎片式文章混淆。
- 本轮明确回答：默认折叠，与修订历史一致。
- 已讨论方案：parent 绑定普通 post；返回父文章；关系校验；完整独立文章页。

- 本轮进一步确认：子文章不涉及分类、归档、系列；不只是列表隐藏，还应省略模板字段与详情归属展示。
