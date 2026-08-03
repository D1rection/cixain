# Research: remark-math 对 `$$` 的解析行为与 hast 渲染

- **Query**: remark-math 的 `$$` 判定条件；去掉 prepareDisplayMath 后同行 `$$` 会怎样；hast 阶段渲染成什么；blockquote 内合法性
- **Scope**: internal（node_modules 源码）+ external（GitHub issue、Obsidian 官方文档）
- **Date**: 2026-08-04

## Findings

### 1. remark-math 的 `$$` 判定条件（源码证据）

remark-math v6.0.0 = micromark-extension-math v3 + mdast-util-math v3（`node_modules/remark-math/lib/index.js:39-41` 只做扩展注册）。

两个独立 construct（`micromark-extension-math/lib/syntax.js:18-27`）：

- **mathFlow（display）**：`math-flow.js`。flow construct（`concrete: true`），只在**行首**触发。要求开头 `$$` 独占行首（含 `> ` 前缀），内容行，结尾 `$$` 独占行首。`sequenceOpen` 之后进入 `meta`，meta 遇到 `$` 即 `nok`（`math-flow.js:117-121`）——所以 `$$x$$ 文字` 开头的行**不是** display。
- **mathText（inline）**：`math-text.js`。text construct，行中任意位置触发。`sequenceOpen`：`sizeOpen < 2 && !single` 才 nok；`singleDollarTextMath` 默认 true，因此 `$x$`、`$$x$$`、`$$$x$$$` 全部按行内解析（`math-text.js:19-21, 71-84`）。`previous`（`math-text.js:229-232`）只挡 `$` 紧跟 `$` 的情况。

**实验验证**（unified + remarkParse + remarkMath 的 AST）：
- `inline $$x^2$$ text` → `paragraph[text("inline "), inlineMath("x^2"), text(" text")]`
- `$$x$$ alone line is display?` → **也是 inlineMath**（meta 撞 `$` 使 flow nok）
- `> quote $$x$$ inline` → blockquote 内 inlineMath
- `$$\nx\n$$` → `math` 节点（display，正常）
- `` `$$not math$$` `` 与 fenced code → `inlineCode`/`code` 节点，不受影响

结论：**去掉 prepareDisplayMath 后，同行/同段落 `$$...$$` 会被 remark-math 解析成 inlineMath（行内公式），渲染为行内 KaTeX，不是 display，也不报错**。display 必须 `$$` 独占行。这是设计如此：remark-math issue #115 "Display math only availabe after newline" 以 closed（预期行为）告终（https://github.com/remarkjs/remark-math/issues/115）。

### 2. inlineMath 节点丢失定界符信息（关键）

`mdast-util-math/lib/index.js:123-154`：`enterMathText` 产出的节点只有 `{type: 'inlineMath', value, data}`——**不记录定界符是 `$` 还是 `$$`**。`$x$` 与 `$$x$$` 产生完全相同的 inlineMath 节点。AST 层无法从节点本身区分。

### 3. hast 阶段输出（实验验证）

- remark-math 默认：`math`（display）→ `data.hName: 'pre'` + `code.language-math.math-display`（`mdast-util-math/lib/index.js:52-69`）；`inlineMath` → `code.language-math.math-inline`（:123-137）。
- rehype-katex 对 `pre > code` 匹配 `math-display` 后把 **pre 整体替换**为 KaTeX 输出（`rehype-katex/lib/index.js:77-99`，替换逻辑 :143-150）。
- KaTeX `displayMode: true` 输出 **`<span class="katex-display">`，是 span 不是 div**（实验：`katex.renderToString('x', {displayMode: true})`）。katex.css 定义 `.katex-display{display:block;margin:1em 0;text-align:center}`（`node_modules/katex/dist/katex.min.css` 末尾）。

**HTML 合法性**：
- blockquote 内容模型是 flow content，`div/pre/p` 直接子节点都合法；display math 作为 blockquote 直接子节点（`> $$\n> x\n> $$`）完全合法。
- 唯一的坑是「块级元素嵌在 `<p>` 里」：若 math（display）节点位于 paragraph 内部，remark-rehype 先产出 `<p>…<pre>…</pre>…</p>`（pre 在 p 内不合 HTML 规范），但 **rehype-katex 在 stringify 前把 pre 换成 span**，最终 HTML 为 `<p>…<span class="katex-display">…</span>…</p>`——span 是 phrasing content，合法，且 `.katex-display{display:block}` 视觉上是块级。实验确认渲染正常（含 blockquote、list item 内）。
- 注意：若未来去掉 rehype-katex，`pre` 在 `p` 内的中间态会泄漏为非法 HTML——保留 rehype-katex 是本方案的前提。

### 4. 业界做法（外部证据）

- **Obsidian 官方文档**（obsidianmd/obsidian-help，Math 章节）：display 用 `$$` 独占行，行内用 `$…$`；**没有**「同行 `$$` 转 display」的语法。与本项目需求的「同行 `$$` → display」不一致，说明该需求是自定义行为。
- **remark 生态**：npm 搜索（registry 官方 API）无同类插件。`remark-math-extended`（$C_L$ 与 `\(…\)`/`\[…\]` 定界符）、`@ziloen/remark-math`（fork）均不做「同行 `$$` → display」。remark-math 自身立场见 issue #115。
- **mdx 生态**：MDX 无内置数学，通行做法就是 remark-math + rehype-katex/mathjax，同行 `$$` 行为与 remark-math 一致（inline）。

## Caveats

- 未验证 Typora/Pandoc 的同价行为（未找到可 curl 的权威文档），但其与 remark-math/Obsidian 同源（LaTeX 惯例：display 独占行），不影响结论。
- 实验脚本在 /tmp/math-exp/（exp1: AST 行为；exp4/exp5: 完整管线验证；2026-07-22-001.md 全文渲染 20 个 display 块 = 17 个独立行 + 3 个 blockquote 同行，全部正确）。
