# 实施计划

## 当前阶段

用户已确认自动收录正文变化；MVP 实现与验收已完成，待用户确认后再决定是否提交代码。

## 执行顺序

- [x] 读取任务、trellis-before-dev 与 frontend 规范，核对并保护用户脏工作区。
- [x] 为块切分、短语 diff、整块新增、复制按钮清理和 interactive 安全降级建立 Node fixture。
- [x] 导出现有 Markdown 编译函数，历史编译复用生产插件顺序；比较器对已编译 HTML 做构建期块级/文本 diff。
- [x] 实现历史提取、相邻去重、当前 baseline 校验、严格 CI。
- [x] 实现短语 diff、复杂块降级、历史交互隔离与内容安全过滤。
- [x] 生成版本索引/比较文件/generation，接入 metadata、单篇 SSG 指针及旧输出清理。
- [x] 接入 build/dev/Actions，保持 deploy 预览兼容。
- [x] 实现阅读器、URL、请求取消/错误状态，接入目录/hash/图片重扫和移动布局样式。
- [x] 同步 content-pipeline、ssg-pipeline、hook-guidelines、quality-guidelines 的静态资源契约。
- [x] 逐条验收 MVP，记录构建、资源完整性、浏览器回归与已知限制。
- [ ] 按项目后续流程评审、提交；本轮不部署或提交代码。

## 验证

当前 package.json 无 lint/typecheck scripts；Node 原生行为测试 5/5 通过：node --test tests/revisions/*.test.mjs。
生产检查 npm run build 通过；CI=true node scripts/build-history.js 通过并生成 15 篇文章历史。
浏览器检查通过：默认最新→历史版本、三档历史选择、深链刷新、目录锚点、回到最新；比较资源 21 个全部存在。
首版明确限制：历史路径 rename 不追踪；未建立独立 Git merge/浅克隆临时仓 fixture；尚未跑完整 375px/深浅主题/键盘/跨文章视觉矩阵。
产物扫描无 draft/删除文章或未提交正文，无全站历史正文注入，相同输入两次构建一致。
fixture 覆盖中文/英文/emoji/链接目标的 diff 行为；Git 历史边界作为实现限制记录，不在用户仓库制造测试提交。

现有构建会更新公共生成文件。测试前记录脏状态；会覆盖用户改动时用隔离副本验证，不能提交用户正文或破坏性恢复以制造干净目录。

## 风险检查点

编译器复用与测试通过；rename 边界已写入设计；当前 HTML diff 低可信时整块降级；客户端永远能返回最新；本地预览与严格生产行为明确。
不扩展为任意双版本比较、复杂时间线或无关历史问题修复。

## 启动门槛

- [x] 自动收录版本粒度已确认。
- [x] PRD/design/implement/research 存在；task.py validate 已通过（校验上下文清单，非产品测试）。
- [x] 用户明确要求实施后已运行 task.py start。

Codex 默认 inline，主代理读取规范/研究，不强制创建子代理或填充 JSONL。
