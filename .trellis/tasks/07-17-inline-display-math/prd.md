# PRD: 行内 $$ 转展示公式

## 问题

`remark-math` 将行内 `$$x^2$$` 视为 `inlineMath`，渲染为行内公式（小字号），但 Obsidian 中 `$$...$$` 无论位置都应渲染为展示公式（大字号、居中）。

## 方案

在 `remark-math` 前插入预处理插件 `prepareDisplayMath`，将行内 `$$...$$` 替换为带换行的格式，让 remark-math 正确识别为 display math。

### 改动范围

| 文件 | 改动 |
|------|------|
| `scripts/build-posts.js` | 新增 `prepareDisplayMath` 插件，加入 pipeline（在 remark-math 之前） |

### 详细设计

插件逻辑：
- 遍历 remark AST
- 在文本节点中查找 `$$...$$` 模式
- 把该文本节点按 `$$...$$` 拆分，将原段落分割为：`前文` / `空行+$$+内容+$$+空行` / `后文`
- 这样 remark-math 看到独立 `$$...$$` 会生成 `math`（display）而非 `inlineMath`

```
输入: 文本节点 "考虑公式 $$x^2$$ 的结果"
输出: 拆分后:
  paragraph: [text("考虑公式 ")]
  math: [text("x^2")]          ← display
  paragraph: [text(" 的结果")]
```

### 不做的

- 不改动 `$...$` 单美元符号行为（保持行内）
