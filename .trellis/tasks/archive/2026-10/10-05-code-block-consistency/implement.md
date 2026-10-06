# 实施计划（未启动）

> 已关闭：用户于 2026-10-05 取消实施并要求归档；本文仅保留历史方案，不是待执行计划。

## 实施门槛

- [x] 用户授权创建任务并设计方案。
- [x] 读取 frontend 内容编译、排版、组件、SSG 与质量规范。
- [x] 核对 Shiki 4.2.0 本地类型和源码，查阅官方 rehype 文档；Context7 在当前会话不可用，已记录核对来源。
- [x] 内存实验验证纯文本回退，并复现交互标记被回退语言消费的问题。
- [ ] 用户评审方案并明确要求实施；之后才运行 `python3 .trellis/scripts/task.py start .trellis/tasks/10-05-code-block-consistency`。

当前不执行下列实现、构建、规范修改或提交步骤。

## 1. 编译链

- [ ] 记录当前 dirty paths，只处理本任务文件；保留用户已有笔记和生成文件修改。
- [ ] 提前 `rehypePlugin` 至 KaTeX 后、Shiki 前，保持占位结构与 interactive 元数据。
- [ ] 设置 `defaultLanguage: 'text'` 与 `fallbackLanguage: 'text'`，保留主题与 `data-line` transformer。
- [ ] 从 `normalizeFoldContent` 移除语言补齐，仅保留题干标题逻辑。
- [ ] 提升 `CONTENT_COMPILER_VERSION`；不修改锚点算法、schema 或历史比较逻辑。

## 2. 样式

- [ ] 在全局主题变量中定义基础代码背景与文字颜色 token，仅在 `.content :global(.pre-wrapper) > pre` 使用；保留 Shiki 行内样式优先级，不改变历史交互代码框的配色。
- [ ] 保留行号、字号、横向滚动、复制按钮以及 fold/移动端现有规则。

## 3. 必要回归

使用 `compileMD` 与临时内容目录，不依赖线上、不在真实 content 目录生成测试产物。建议新增 `tests/content/code-blocks.test.mjs`，围绕输出契约断言，避免大段主题 HTML 快照。

- [ ] 比较无语言、text、plaintext、未知语言、缩进代码和空块的结构；对普通相同文本断言背景主题一致、行数正确、每块恰一个包装与复制按钮。
- [ ] 已知语言和别名仍着色；文本含缩进、内部空行、制表符、非断行空格与 `<>&` 时保真，并符合末尾换行约定。
- [ ] 有效 `react:FlashCard` 保留占位及 metadata，没有普通代码包装；与普通代码混用时各自处理正确。
- [ ] 行内与块级数学仍生成 KaTeX，行内代码不新增包装；正文、引用、callout、fold 无语言块均统一，fold 标题仍不进入 TOC。
- [ ] 无语言及未知语言代码后的 `^id` 正确挂载到 `pre-wrapper`，前面的其他块不得误得 ID。
- [ ] 用临时 posts/fragment/pages 集合验证共享输出；MNIST 原 Markdown 作为现实复现材料，7 个块均统一，不修改源文。
- [ ] 运行 `npm run test:content` 和 `npm run test:revisions`。package.json 没有 lint/type-check 命令，不添加虚构检查；以现有测试与构建为准。

## 4. 构建与浏览器验证

- [ ] 在包含当前已授权实现的隔离副本中运行 posts、history、Vite、static renderer 和 search-index 各构建步骤；依次使用 `npm run build:posts`、`npm run build:history`、`npx vite build`、`node scripts/static-renderer.js`、`node scripts/build-search-index.js`。不要从真实工作区运行会改写生成文件的验证。
- [ ] 明暗主题分别检查桌面 1280px、移动端 390px，以及 768px/769px 行号边界；fold 展开时行号保持隐藏。
- [ ] 检查 MNIST 7 个块、已知语言块、超长行、复制内容和数学公式；用真实数据验证 FlashCard 翻转、TabGroup 切换和 CodeCompare 同步滚动及自有配色，无页面级横向溢出。
- [ ] 检查静态首屏与 SPA 导航输出一致、块锚点定位、文章历史比较的代码内容与新增 generation。

## 5. 规范与收尾

- [ ] 更新 content-pipeline 的全局无语言/未知语言策略、交互与 Shiki 顺序；清除旧 `github-dark` 描述及 fold 专用语言补齐描述。
- [ ] 在 typography/SSG 规范记录基础代码配色与保留的行号规则；仅补实际新增契约。
- [ ] 检查本任务变更范围与验证结果，按 Trellis 流程提交审阅后再决定提交及归档，不混入用户已有修改。

## 回退点

编译配置、交互占位顺序、fold 清理、样式 token 和编译版本号构成一个完整改动单元；回退此单元后重新生成内容与历史资源。仅撤销语言回退配置或仅调整占位顺序不能作为交付状态。
