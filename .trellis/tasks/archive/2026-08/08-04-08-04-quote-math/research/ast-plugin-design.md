# Research: AST 方案可行性与推荐实现（含 unist-util-visit 坑）

- **Query**: text 节点拆分 `$$` 是否可行；visit 时 splice 的坑；推荐的实现方式
- **Scope**: internal（unist-util-visit 源码 + 实验验证）
- **Date**: 2026-08-04

## Findings

### 1. 原计划（text 节点拆分）与 remark-math 冲突 —— 关键结论

原计划「遍历 text 节点把 `$$...$$` 拆成 math 节点」在**当前管线（含 remark-math）下不成立**：

- remark-math 是 **micromark 解析扩展**（`remark-math/lib/index.js:32-41` 写入 `data.micromarkExtensions`），在 remark-parse 的**一次性解析阶段**生效；自定义 remark 插件是 transformer，在解析**之后**运行。`.use()` 顺序无法改变这一点（remark-math 不是 transformer）。
- 解析阶段 `$$` 已被 mathText 消费成 inlineMath（见 remark-math-behavior.md 实验），**text 节点里永远不会出现 `$$`**。实验验证：插件无论放在 `.use(remarkMath)` 前还是后，同行 `$$` 都渲染为行内 katex（inlineMath 未被插件触及）。
- 「代码块不受影响」的前提（只遍历 text 节点）本身成立，但前提场景（text 里有 `$$`）不存在。

推论：若要 text 拆分方案生效，必须去掉 remark-math 并自行实现 `$…$` 行内解析（重复 remark-math 的边界逻辑：`\$` 转义、`$$$` 序列、行尾空行 padding 等），或把 `$$` 拦截做进 micromark 扩展（需写 tokenizer，math-flow 约 300 行）。都不划算。

### 2. 推荐方案：inlineMath 节点就地转换 + source position 判定定界符（已验证可行）

博客正文同时使用 `$$…$$`（display 意图，含 blockquote 同行）和 `$…$`（行内，2026-07-18-001.md 大量使用，如 `$10^{10}$`、`$O(1)$`）。inlineMath 节点不区分 `$`/`$$`，但节点带 `position`（指向源码），且 transformer 能拿到 `file.value`：

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
        hName: 'pre',
        hChildren: [{ type: 'element', tagName: 'code',
          properties: { className: ['language-math', 'math-display'] },
          children: [{ type: 'text', value: node.value }] }]
      }
    }
    visit(tree)
  }
}
```

要点：
- 只转换定界符为 `$$` 的 inlineMath（`src[start] === '$' && src[start+1] === '$'`）；`$x$` 保持 inlineMath 不动。
- 节点形状完全复刻 mdast-util-math 的 `math` 节点（`mdast-util-math/lib/index.js:52-69`），rehype-katex 靠 className `math-display` 匹配，与来源无关（实验验证）。
- **无需改源字符串、无需管代码块**：`$$` 在 code/inlineCode 里根本不会成为 inlineMath。

**实验验证**（exp4/exp5，unified 全管线）：
| 输入 | 结果 |
|---|---|
| `para $$x^2$$ after` | `<p>para <span class="katex-display">…</span> after</p>` display ✓ |
| `> quote $$h_\theta(x)$$ end` | blockquote 内 display ✓ |
| `a $10^{10}$ b` | 行内 katex 不变 ✓ |
| `$$\nx\n$$`（独立行） | remark-math mathFlow 正常，插件不干预 ✓ |
| `` `$$keep$$` `` / fenced code | 原样保留 ✓ |
| `- item $$x$$` | li 内 display ✓ |
| 2026-07-22-001.md 全文 | 20 个 display 块（17 独立 + 3 blockquote 同行）全部正确 |

与现方案差异：prepareDisplayMath 把 `文字 $$x$$ 文字` 拆成三段（`<p>文字</p><display/><p>文字</p>`）；本方案保持同一 `<p>`，内部 span.katex-display 块级展示（CSS `display:block`），视觉等价、HTML 合法。旧的 blockquote `\n>\n> $$…` hack 整体删除。

注意事项：
- 依赖 inlineMath 的 `position` 与源码一致——管线中 transformer 都不改源码，position 可靠；本插件应放在 remarkObsidianLink/remarkHighlight 之前（它们会重建部分节点，可能丢 position）。
- rehype-katex 必须保留（见 remark-math-behavior.md 第 3 节，否则 pre-in-p 泄漏为非法 HTML）。
- `$$$x$$$`（三个 `$`）也会被转 display（定界符 ≥2），与 remark-math 行为一致，可接受。

### 3. unist-util-visit 使用坑（源码证据）

`unist-util-visit` 委托 `unist-util-visit-parents`（`unist-util-visit/lib/index.js:278-312`）。遍历循环（`unist-util-visit-parents/lib/index.js:355-375`）：访问完子节点后 `offset = subresult[1] ?? offset + step`。

- **splice 替换自身**：visitor 里 `parent.children.splice(index, 1, ...newNodes)` 后返回 CONTINUE（不返回数字），游标从 `index+1` 继续——会**遍历到新插入的节点**。对 text 拆分场景这正是想要的（分裂出的 text 片段若还含 `$$` 会被再处理，终止条件：每次全量分裂后新 text 不含 `$$`）。无 index 偏移 bug。
- **JSDoc 明示的坑**（`unist-util-visit-parents/lib/index.js:152-162, 180-188`）：① 在**当前节点之前**插入/删除兄弟节点（或 reverse 模式下在之后）必须返回新的 index；② 替换节点自身而不返回 SKIP 时，其**后代仍会被遍历**（文档称为 bug）——text 无后代，本方案不受影响；③ 返回 SKIP 表示不深入后代。
- **本方案实际不 splice**：Design F 就地改 `node.type`/`node.data`（不增删 children），零 index 风险。若后续做 text 拆分，项目内 `remarkHighlight`（build-posts.js:95-118）的「倒序遍历 + splice」模式是已验证的稳妥写法；或返回 `[CONTINUE, index + insertedCount]` 跳过重复访问。

## Caveats

- 未评估：`$$` 内含 `\n` 且跨行闭合的同行公式（mathText 允许跨行）——渲染为 display 时 KaTeX 把字面换行当空白，与 remark-math mathFlow 对内容换行的处理一致，无新风险。
- 未评估 `remark-breaks` 与转换后的 math 节点交互（breaks 只处理 text，无冲突）。
- 备选方案（未实验）：`remarkMath({ singleDollarTextMath: false })` + 转换全部 inlineMath + 插件内自实现 `$…$` 行内——可行但重复实现多，不如 position 判定简单。
