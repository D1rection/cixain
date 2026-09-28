# 实施计划

本任务已按 prd/design 实现。脚本语法、客户端模块转换和 Trellis 上下文校验通过；完整生产构建在隔离 worktree 中通过，未改写当前工作区的用户生成文件。构建 checkout 没有 fragment Markdown，因此没有实际碎片页可渲染验证。未运行测试或浏览器检查。任务 2 `09-28-search-quality` 已在本任务代码完成后启动。

1. [x] 读取 frontend 内容/SSG/组件/hooks/质量规范；核对实际 wouter 代码（部分规范仍写 react-router，不能照抄）。记录工作树已有改动。
2. [x] 引入内容身份、URL 与发布清单；新增 fragment 元信息解析和模板；抽出可共享编译器，保持历史编译 API 兼容。
3. [x] 实现两遍引用解析、稳定锚点和反向链接；覆盖双链及标准站内 Markdown 链接。
4. [x] 实现 Fragment 阅读页、开发数据、SSG、自身正文按页分发、sitemap/basic meta；不添加列表和导航。生产输出使用当前清单并处理上次构建残留。
5. [x] 最小接入现有搜索：id/kind/url/tags、碎片收录和可靠导航；kind 保留为内部区分，不在结果界面显示类型。
6. 完整生产构建在隔离 worktree 中通过；该 checkout 没有 fragment Markdown。未新增或运行测试，也未做浏览器检查。
7. [x] 已更新 content/SSG/hook/quality 规范。初始工作树已有的 Obsidian、模板、文章列表、RSS、站点地图和 OG 图修改不属于本次变更。
8. 提交前仍需按项目流程列出本次改动与提交计划。

项目未配置 lint/typecheck 命令，不虚报。第二任务只有在本任务契约与验收完成后才 start。
