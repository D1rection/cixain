# 引用块内公式渲染 — 技术设计

## 1. 背景

当前 `prepareDisplayMath`（build-posts.js:272-282）用字符串正则替换 markdown 源码，把同行 `$$...$$` 转独立段落。问题：
- 正则无法区分代码块/行内代码/引用块中的 `$$` → 代码块被破坏（实测）
- blockquote hack（`\n>\n> $$`）导致嵌套引用公式 KaTeX 报错、同行公式段落撕裂

## 2. 核心机制

remark-math 是 micromark 解析扩展，在 parse 阶段把 `$$...$$`（同行）消费成 `inlineMath` 节点。inlineMath 不记录定界符，但节点带 `position`（源码偏移）。

新插件利用这一点：遍历 AST 中的 inlineMath 节点，用 position 回溯 `file.value` 判断定界符：

```js
function remarkInlineDisplayMath() {
  return (tree, file) => {
    const src = String(file.value)
    const visit = (node) => {
      if (node.children) node.children.forEach(visit)
      if (node.type !== 'inlineMath') return
      const start = node.position?.start?.offset
      if (typeof start !== 'number' || src[start] !== '$' || src[start + 1] !== '$') return
      node.type = 'math'
      node.meta = null
      node.data = {
        hName: 'code',  // 用 phrasing 而非 flow（pre）：pre 会被 remark-rehype 提升出段落，导致同行公式段落撕裂
        hProperties: { className: ['language-math', 'math-display'] },
        hChildren: [{ type: 'text', value: node.value }],
      }
    }
    visit(tree)
  }
}
```

- `$$` 定界 → 转 math 节点（display）
- `$` 定界 → 保持 inlineMath（行内）

## 3. 为什么代码块安全

`$$` 出现在 fenced code 里是 `code` 节点，出现在行内代码里是 `inlineCode` 节点——**都不会被解析成 inlineMath**。插件只处理 inlineMath，天然免疫。

## 4. 渲染路径

math 节点（display）→ remark-rehype 产出 `code.language-math.math-display`（hName 用 code 保持 phrasing，避免段落撕裂）→ rehype-katex 按 `math-display` class 设 displayMode 替换为 `<span class="katex-display">`（KaTeX displayMode 输出 span 非 div）→ 在 `<p>` 内合法（span 是 phrasing content），`.katex-display{display:block}` 视觉块级。

## 5. 管线位置

```
remarkParse → remarkGfm → remarkBreaks → remarkMath
  → remarkInlineDisplayMath（新增，必须在此处）
  → remarkObsidianLink → remarkPlugin(react) → remarkImagePipe → remarkHighlight
  → remarkRehype → rehypeCallout → rehypeRaw → rehypeKatex → ...
```

位置约束：在 remarkObsidianLink / remarkHighlight 之前——它们会重建节点，可能丢 position。本插件只读 position + 就地改 type/data，不增删节点。

## 6. 删除内容

`prepareDisplayMath` 整体删除（build-posts.js:272-282 的 `source.replace` 块）。

## 7. 已知边界（调研确认可接受）

- `$$$x$$$`（三个 $）也会转 display——与 remark-math 行为一致
- `$$` 内含换行且跨行闭合——KaTeX 把字面换行当空白，与 mathFlow 行为一致
- remark-breaks 只处理 text 节点，与转换后的 math 节点无冲突

## 8. 变更文件

| 文件 | 改动 |
|------|------|
| `scripts/build-posts.js` | 删除 prepareDisplayMath；新增 remarkInlineDisplayMath 插件并接入管线 |
