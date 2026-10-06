# 渲染差异与方案验证

核对日期：2026-10-05。以下为只读调查与内存实验，未修改实现或生成产物。

## 当前证据

- `content/fragment/mnist-format.md:14` 是 `plaintext` 围栏，其余 6 个围栏未标注语言；对应 HTML 仅第一个有 `.shiki`、主题行内颜色和 `.line[data-line]`。
- 通过读取 `https://blog.cicadae.cloud/fragment/mnist-format/` 的页面 HTML，确认线上与本地产物相同；线上 CSS 也仅对 `.shiki .line` 生成行号。浏览器自动查看曾超时，因此不声称已完成浏览器截图/计算样式验收。
- `scripts/build-posts.js` 的 Shiki 配置没有 defaultLanguage/fallbackLanguage；`normalizeFoldContent` 仅为 fold 补 `language-text`。
- `src/components/PostContent.module.css` 的基础 `pre` 无背景与颜色，主题来源依赖 Shiki 行内输出。

## 库来源与语义

已安装 `@shikijs/rehype` 为 4.2.0，声明范围为 `^4.2.0`。当前会话未提供 Context7，改以安装版本类型、实现及 [Shiki 官方 rehype 文档](https://shiki.style/packages/rehype) 核对，不要求升级依赖。

本地 `node_modules/@shikijs/rehype/dist/types-*.d.mts` 声明 defaultLanguage 与 fallbackLanguage；`core-*.mjs` 的处理路径为：无 parsed.lang 取 defaultLanguage，无法识别且不 lazy 时取 fallbackLanguage，最终无语言则 return，保留原节点。选定语言后 codeToHast 重建节点；默认移除一个末尾换行。text/plaintext 属于可识别纯文本语言。

官方文档说明 rehype 基于 HAST 工作，postprocess 不执行；本方案只用现有 line transformer 和配置，无需 HTML 字符串往返。

## 内存实验结果

使用当前安装的 unified、remark-parse、remark-rehype、rehypeShiki 和 rehype-stringify，传入 defaultLanguage=text、fallbackLanguage=text 和现有逐行属性规则。以下输入全部生成 `.shiki` 结构：无语言、text、plaintext、未知语言、缩进代码、空块。相同文本的无语言与 plaintext 处理差异已复现；以上验证仅说明配置能力，不等同于修改后的完整编译链验收。

从当前脚本读出原 `createInteractivePlugins` 函数，在内存中验证两种顺序：

| 顺序 | 结果 |
| --- | --- |
| remark interactive → remarkRehype → Shiki（启用回退）→ rehype interactive | `react:FlashCard` 的占位丢失，内部语言标记被 Shiki 消费 |
| remark interactive → remarkRehype → rehype interactive → Shiki（启用回退） | 原 `data-interactive="FlashCard"` 占位保留，不产生普通 Shiki 代码块 |

因此应先转换有效交互占位再启用未知语言回退。完整链仍需实施后的 KaTeX、fold、块引用、复制及历史回归；本轮不提前声称通过。

## 相关契约

- `scripts/lib/heading-links.js` 当前 CONTENT_COMPILER_VERSION 为 `headings-1`；`build-history.js` 将其组合进 compilerVersion/generation，编译契约升级应提升版本。
- `src/main.jsx` 复制读取 `code.textContent`，CSS 行号为伪元素，不应混入剪贴板。
- frontend typography 明确 fold 隐藏行号；普通正文 ≤768px 隐藏行号。统一语言行为不代表取消这些场景规则。
- `.trellis/spec/frontend/content-pipeline.md` 仍有 `github-dark` 的旧描述，与当前 Everforest 配置冲突，实施时需一并修正文档。

## 组件边界复核

用户提出其他组件兼容性疑问后，核对 SegmentsRenderer 及 FlashCard、TabGroup、CodeCompare 源码：三者使用自己的 CSS Modules；CodeCompare 的代码行是 div/span，不是 pre/code。未知语言回退的风险在占位转换之前，已有提前转换方案解决。

发现历史 diff 将交互占位转成 `pre.revision-interactive-code`，属于组件内容降级展示，不应该被普通代码背景一并改色。因此收紧设计：新增配色仅匹配 `.content :global(.pre-wrapper) > pre`；不向所有 `.content pre` 添加背景/文字颜色。历史普通 Markdown 代码仍有 pre-wrapper，采用新规则；历史交互源码框无 pre-wrapper，保持原配色。此处为源码边界核对，完整浏览器行为验收仍待实施。
