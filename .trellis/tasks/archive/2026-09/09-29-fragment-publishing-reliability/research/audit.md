# 内容审计与实施决策

2026-09-29：在 /tmp 独立副本运行旧生产构建，旧检查未报告失效块或目标；两篇新增文章为草稿。现有碎片未发现需要迁移的 wiki 引用。

扩大到标题锚点校验后发现一条已提交文章的旧链接：content/posts/2026-09-27-001.md:149 使用 [[2026-08-18-001#4.2 共轭性（Conjugacy）|指数族相关章节]]，而目标 HTML 的实际 ID 是 42-共轭性conjugacy。确认来源文件无用户未提交修改后，仅修正这一目标片段，别名及正文其余内容不变。未创建历史豁免表；修正后新生产构建成功。

现有 useHashScroll 只接受 ASCII 块 ID，异步加载后无法定位中文标题；扩大为解码一次的完整 ID，继续用 getElementById 定位，不改变 ID 生成规则。

库接口核对：当前 Context7 不可调用。检查了本地 remark-obsidian-link 0.2.4 的 wikiLink AST 替换顺序及 toLink 契约；并查阅官方 unified 与 React effect 文档：
- https://github.com/unifiedjs/unified
- https://react.dev/reference/react/useEffect

没有新增依赖。文件写入采用内存暂存，元数据及引用验证通过后才开始落盘；这不宣称磁盘写入发生 I/O 错误时具备文件系统事务回滚。
