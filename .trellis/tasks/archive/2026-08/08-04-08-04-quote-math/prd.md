# 引用块内公式渲染重构

## Goal

替换当前 `prepareDisplayMath` 字符串替换方案。该方案无法区分代码块/行内代码/引用块中的 `$$`，实测会：
1. 撕裂引用块内同行公式的段落（`> 文字 $$x$$ 文字` → 三段）
2. **破坏代码块内容**（代码里的 `$$` 被提取重排）
3. 嵌套引用内公式 KaTeX 报错

新方案改为在 AST 层处理，保证代码块安全、段落完整、嵌套引用正常。

## Requirements

- 引用块内 `$$...$$`（含同行、独立行）正确渲染为展示公式
- **代码块 / 行内代码里的 `$$` 完全不受影响**
- 普通段落中的 `$...$` 行内公式行为不变
- 普通段落中的独立行 `$$...$$` 展示公式行为不变
- 嵌套引用 `> > $$...$$` 正确渲染
- 段落不撕裂：`> 文字 $$x$$ 文字` 保持同一段落，公式块级展示在段内
- 删除 `prepareDisplayMath`（含 blockquote `\n>\n> $$` hack）

## 业界调研结论（已归档 research/）

- remark-math 是**解析期**扩展：同行 `$$...$$` 会被解析成 `inlineMath`（行内），不是 display，也不报错；display 必须 `$$` 独占行（remark-math issue #115 设计如此）
- inlineMath 节点**不记录定界符**（`$x$` 和 `$$x$$` 产生相同节点），但节点带 position 可回溯源码
- 业界（Obsidian、remark 生态、MDX）均无「同行 `$$` → display」的现成实现，属本项目自定义需求
- KaTeX display 输出 `<span class="katex-display">`（span，非 div），在 `<p>` 内合法；blockquote 内容模型接受 flow content

## 推荐方案（调研已验证）

遍历 AST 的 `inlineMath` 节点，用 `node.position` 回溯源码判断定界符是 `$$` 还是 `$`：
- `$$` → 就地转成 `math` 节点（复刻 mdast-util-math 的节点形状，rehype-katex 按 className 匹配渲染成 display）
- `$` → 保持 inlineMath 不动

代码块不受影响的原因：`$$` 在 code/inlineCode 中根本不会成为 inlineMath 节点。

## Acceptance Criteria

- [ ] `> 文字 $$x$$ 文字` → 同一段落内 display 公式，段落不撕裂
- [ ] 代码块中 `$$E=mc^2$$` 原样保留，代码内容不错乱
- [ ] 行内代码 `` `$$x$$` `` 原样保留
- [ ] `> > 嵌套 $$a+b$$` 正确渲染
- [ ] `$...$` 行内公式、独立行 `$$` 展示公式均无回归（现有文章渲染对照）
- [ ] 删除 prepareDisplayMath 后构建成功，所有现有文章公式渲染与之前一致或更好

## Notes

- 涉及文件：`scripts/build-posts.js`（删除 prepareDisplayMath + 新增插件）
- rehype-katex 必须保留（否则 pre-in-p 中间态泄漏为非法 HTML）
- 插件应放在 remarkObsidianLink / remarkHighlight 之前（它们重建节点可能丢 position）
