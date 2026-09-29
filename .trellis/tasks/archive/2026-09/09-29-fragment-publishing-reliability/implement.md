# 实施顺序

1. 用户确认实施后 start 任务；执行 trellis-before-dev，读取 frontend 的 content-pipeline、quality、component、SSG、hook 指南和 shared guides。记录 dirty paths，构建与夹具在独立副本执行。
2. 先形成引用审计报告，确认旧碎片默认链接迁移范围和历史失效引用；记录已有生成文件，禁止覆盖用户修改。
3. 为目标解析建立表驱动 node:test 夹具，覆盖文章/碎片双向、同名、别名、中文及特殊字符、同文锚点、显式 posts 前缀。实现纯解析模块并接入正文和搜索，去掉各自重复规则。
4. 实现全量/可见 registry、结构化诊断、普通内容链接及标题/块校验；新增生产失败与开发告警集成测试。校验先于输出写入；审计确有历史债务时再提交精确豁免方案。
5. 添加 fragment frontmatter 日期及布尔类型验证；用多时区子进程及边界日历用例验证。修改模板并编写指南，确认教程不进入渲染、摘要和搜索。
6. 修复 FragmentPage 加载状态、BASE_URL、请求取消、重试和响应校验。用浏览器拦截覆盖慢请求、404、200 回退整页、切换路由/重试竞态，验证 SSG 内联不重复获取。
7. 增加 test:content 命令并执行相关 node:test、npm run test:revisions、npm run build、git diff --check。生产验证包含“先 dev 生成草稿，再 production”以检查残留 HTML 不泄露；BASE_URL 非根路径验证正文请求。
8. 按 trellis-check 复核行为和边界，更新规范中旧链接语义、草稿、日期与校验契约，写验收记录，明确未测设备行为。提交/归档/推送另按用户指示处理。

## 风险重点
严格校验暴露历史债务；日期兼容误伤文章；标题锚点必须读取最终编译 ID；双重引用收集造成重复诊断；HTTP 200 托管回退伪装成功；请求竞态导致旧正文串页。测试必须验证行为而非仅匹配源码。
