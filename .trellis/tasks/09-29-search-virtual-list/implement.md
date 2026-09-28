# 实施计划（已实施并完成自动化验收）

1. 按 trellis-before-dev 读取 frontend index、component-guidelines、quality-guidelines、content-pipeline 与 shared guides；复核任务文档及工作区既有修改。
2. 核对 @tanstack/react-virtual 实际版本和 React 19 兼容性，添加依赖和 lockfile，记录构建基线。
3. 实现 SearchResultsList 及 CSS Module：全量 count、稳定 key、测量、占位高度、overscan 和活动项保留。
4. 移除 SearchOverlay 的 limit/visibleResults/更多按钮，接入总数、查询重置、全量选择与原生链接。
5. 实现键盘滚动请求和 hover 分离、Tab 环及 ARIA 位置；处理宽度/字体改变后的测量失效和阅读锚点恢复。
6. 浏览器夹具注入真实形状的 0/1/10/1000 条混合高度结果，不写入线上索引。记录 1280×800、390×844 和 320px 窄屏的节点数：1000 条结果时上述视口 option 目标不超过 40 个（含保留项），可快速滚动至首尾，无重叠或持续空白。
7. 验证方向键跨视口、手动滚动不拉回、Enter/IME、点击/中键/修饰键、Tab、Esc 恢复焦点、深处改查询、关闭重开、宽度变化、200% 缩放、字体加载、错误重试与空态。可用时以 VoiceOver 验证位置与总数播报；不可用则标记未验证。
8. 执行 npm run test:revisions、npm run build、git diff --check。仓库无 lint/typecheck 脚本，不虚构通过。构建会改生成文件，应在独立临时验证副本执行或安全隔离产物，禁止覆盖用户已有脏文件。
9. 按 trellis-check 完整验收，记录浏览器及构建体积结果；将动态测量和导航约定同步 frontend spec，再按项目流程提交归档。

## 风险与回滚
重点检查测量缓存失效、活动项卸载、hover 触发自动滚动、Tab 逃逸。验证跨视口导航、查询重置和节点数量等真实行为，不写检查代码形状的镜像测试。回滚组件、接线、样式与依赖为一组，保留索引协议。
