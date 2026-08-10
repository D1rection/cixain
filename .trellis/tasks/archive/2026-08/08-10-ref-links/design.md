# 参考链接板块 — 技术设计

## 1. 插件位置

新增 rehype 插件 `rehypeRefSection`（hAST 层），挂载在 `.use(remarkRehype)` 之后、`rehypeCallout` 附近。依赖已满足：

- `remarkBreaks` 把软换行转成 `<br>`（插件结构归一化依赖它）
- `remark-gfm` 自动把裸 URL 识别为 `<a>`（作者只需写裸 URL）

## 2. 识别规则

遍历 hAST：

1. 找 `h2`/`h3` 元素，其 textContent（递归拼接所有文本）**精确等于** `参考` / `参考资料` / `References` 之一
2. 取该标题的下一个元素兄弟（跳过纯文本节点）；若是 `ol` 则命中：
   - `ol.className` 追加 `ref-list`
   - 标题 `className` 追加 `ref-heading`
3. 非 `ol` 兄弟（段落、其他列表、代码块等）→ 不命中，不套样式

「参考实现」「参考文档」等文本不精确匹配，天然跳过。

## 3. 结构归一化（两行式条目）

对 `ol.ref-list` 内每个 `li`：

- 取第一个 `p`；若其中含 `<br>`（作者写了两行式条目）：
  - 以第一个 `<br>` 为界拆分 children → 前半为标题段，后半为 URL 段
  - URL 段包装为新的 `<p class="ref-url">`，插在原 `p` 之后
  - 前半为空（URL 独占一行开头）→ 该 `p` 自身加 `ref-url`
- 若 `li` 有 ≥2 个 `p`（作者用空行分隔两段）→ 最后一个 `p` 加 `ref-url`
- 单行条目（无 `<br>`、单 `p`）→ 不处理，保持原样

## 4. 链接注入

`ol.ref-list` 内所有 `<a>` 注入 `target="_blank"` + `rel="noopener noreferrer"`。仅限参考列表内，正文其他链接行为不变。

## 5. CSS（PostContent.module.css，.content 作用域内）

代码注释风（用户选定，最简方案）：

- `.ref-heading`：缩小字号 + accent 色；构建期注入 Lucide `link-2` SVG（复用 callout 的 `loadIcon` 机制，rehypeRaw 解析 raw 节点），CSS 控制尺寸与基线对齐
- `ol.ref-list`：`list-style: none` + `counter-reset`，无容器无分割线
- `li::before`：`[01]` 计数器（decimal-leading-zero），Silkscreen 像素字 accent 色，绝对定位左对齐
- 两行式条目：标题行沿用 `.content a` 的 accent 下划线；`.ref-url` 淡色小字 + `word-break: break-all`

## 6. 边界情况

| 场景 | 行为 |
| --- | --- |
| 条目标题为纯文本 + 裸 URL 第二行 | gfm 自动链接 URL → ref-url 行可点击 |
| 条目标题为 `[标题](url)` + 裸 URL 第二行 | 两个链接都在，均开新窗口 |
| 单行条目（仅标题） | 原样渲染 |
| `## 参考` 后跟段落 | 不命中 |
| 多个 `## 参考` 标题 | 各自命中各自的列表 |
| 移动端长 URL | `word-break: break-all` 防溢出 |
