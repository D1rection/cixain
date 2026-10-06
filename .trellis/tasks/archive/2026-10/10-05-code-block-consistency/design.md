# 统一代码块渲染设计

> 已关闭：用户于 2026-10-05 取消实施并要求归档；本文仅保留历史方案，不是待执行计划。

## 决策

采用“基础样式兜底 + 所有普通代码块统一进入 Shiki”的组合。基础容器不依赖高亮类；缺少语言按 `text` 处理，未知语言也回退到 `text`。配色保持明暗均为 Everforest Dark。

不批量修改 Markdown，不通过 CSS 模拟第二套逐行结构，也不捕获所有 Shiki 异常。语言回退仅处理语言不可识别；主题或转换器错误继续暴露。

## 构建顺序与边界

建议链路关键段：

```text
remark：提取已有 react:ComponentName，生成内部语言标记
  → remarkRehype / callout / raw / 标题语义采集
  → KaTeX：消费数学节点
  → rehypePlugin：将内部交互代码块转换为原有 div 占位
  → Shiki：defaultLanguage=text，fallbackLanguage=text
  → table wrapper / copy button
  → block ref / heading anchors / image 等后续步骤
```

将现有 `createInteractivePlugins().rehypePlugin` 从 Shiki 后移动到 Shiki 前、KaTeX 后。交互提取、占位格式、元数据和运行时挂载协议均保持不变。无需新增“跳过交互代码”的高亮器或语言白名单。

**顺序不可省略**：当前交互标记为 `language-__interactive__N`。只增加 `fallbackLanguage` 时，Shiki 会将它作为未知语言消费并重建代码节点；随后原转换器找不到标记，组件失效。内存实验已复现，提前转换占位后通过，见 research。

KaTeX 继续先于 Shiki，防止默认纯文本处理接管数学节点。复制包装及块引用继续晚于 Shiki，防止重建节点丢失 ID、双重包装或把 ID 挂到错误节点。

## 语言及行号契约

| 输入 | 构建处理 | 行号 |
| --- | --- | --- |
| 无语言 fenced code、缩进代码 | Shiki `text` | 正文桌面显示，≤768px 隐藏 |
| `text` / `plaintext` | Shiki 纯文本 | 同上 |
| 支持的语言、别名及特殊语言 | 保留 Shiki 当前能力 | 同上 |
| 未知语言 | Shiki 回退 `text`，不猜测、不新增告警 | 同上 |
| fold 内普通代码 | 相同语言策略 | 始终隐藏 |
| 已提取的 `react:ComponentName` | 原交互占位，不送入 Shiki | 不生成普通代码行号 |
| 数学节点、行内代码 | 保留原处理 | 不应用普通代码规则 |

普通代码统一生成 `pre.shiki > code > span.line[data-line]`，外层仍是 `div.pre-wrapper` 与一个复制按钮；内容转义由原编译链负责。行号继续使用不可选中的 CSS 伪元素，复制仍读取 `code.textContent`。

保留 Shiki 默认 `stripEndNewline` 行为：移除解析器附带的一个末尾换行，内部空行和其他空白不变。无语言块与已标注纯文本块现在采用相同约定，避免通过兼容逻辑维持两种末尾空行表现。

## 样式责任

- `src/styles/global.css` 定义基础代码配色 token（建议 `--code-bg: #2d353b`、`--code-text: #d3c6aa`），对应当前 Everforest 默认色，明暗一致。
- `PostContent.module.css` 仅在 `.content :global(.pre-wrapper) > pre` 补 `background-color` 与 `color`，引用上述 token；不直接给 `.content pre` 泛化加色。原基础尺寸与滚动规则保持不变，不使用 `!important`。
- Shiki 行内主题样式及现有暗色变量规则继续负责语法着色，优先于基础色；不改 `.content code` 或行内代码背景。
- 行号选择器保持 `.shiki .line`，因为全部普通 Markdown 代码块都进入统一逐行结构；不对旧普通 HTML 补运行时行号。
- `normalizeFoldContent` 删除“为 pre 补 language-text”的局部逻辑，保留标题转换；语言默认值统一在 Shiki 配置中定义。fold 的 CSS 间距、触屏复制按钮和隐藏行号仍属有意差异。

基础样式保证 `pre-wrapper` 内未带 `.shiki` 的普通代码块也有合理容器外观，逐行标记则由编译器统一生成。历史交互比较专用的 `pre.revision-interactive-code` 没有此包装，不改变其配色或行号。基础配色作用域不扩展到组件自有的 `pre`。

已核对现有三个交互组件：FlashCard 与 TabGroup 渲染普通 div/p/button；CodeCompare 使用 div/span 和自己的 CSS Modules，不输出 pre/code/shiki 节点，因此不匹配新增背景或行号选择器。交互挂载继续由 SegmentsRenderer 完成，本任务不修改组件及其状态逻辑。实施时使用真实 front/back、tabs、before/after 数据检查三种组件，不能只验证占位字符串。

## 兼容与发布

共享 `prepareMD` / `compileMD` 链路使文章、碎片、静态页及文章历史正文同时得到新规则，无需页面专用修复。SSG 和 SPA 继续消费相同构建 HTML，不新增运行时 DOM 高亮。

编译 HTML 结构发生变化，需要提升 `scripts/lib/heading-links.js` 的 `CONTENT_COMPILER_VERSION`（建议 `headings-1` → `headings-2`）。`build-history.js` 已组合此版本生成历史 generation，复用现有失效机制，不修改 schema 或历史 diff 算法。新版本号仅代表编译契约升级，不改变标题 slug 算法。

渲染修复不修改文章日期、正文或已有 Git 快照。生成 HTML 须在实施后统一重建；完整构建在隔离副本执行，避免覆盖工作区既有修改。源码与生成产物按现有流程发布；回退时同时回退本任务实现并重新构建，不能只回退 CSS。

## 候选方案取舍

| 方案 | 结论 |
| --- | --- |
| 给文章所有围栏补 `plaintext` | 只修当前内容，作者仍会踩坑，不采用 |
| 仅补 `pre` 背景 | 能修背景，逐行结构和行号仍有差异，不足以满足验收 |
| 仅设置 `defaultLanguage` | 能修无语言块，但未知语言仍绕过统一结构，且无基础样式兜底 |
| 默认与回退语言 + 提前交互占位 + 基础样式 | 覆盖合法省略、未知语言及兼容边界，推荐 |

本轮设计保留现有行号策略；是否整体去掉行号或改成浅色代码主题属于独立视觉调整。
