# 表格渲染设计

## 管道变更

在 `build-posts.js` 的 unified 管道中，在 `remarkParse` 之后、`remarkBreaks` 之前插入 `remarkGfm`：

```
remarkParse → remarkGfm → remarkBreaks → remarkMath → ...
```

**顺序考虑：** remark-gfm 需在 remark-math 之前，因为 GFM 的表格语法（`|`）与 math 的 `$` 不冲突；先解析表格结构再处理行内数学。

## 新增依赖

- `remark-gfm` — GFM 表格、任务列表、删除线等扩展语法

## CSS 样式

在 `PostContent.module.css` 的 `.content` 作用域内添加：

- `table` — 全宽、边框合并
- `th` — 表头粗体、底色、下边框
- `td` — 单元格内边距
- `tr:nth-child(even)` — 斑马纹
- 使用 `:global()` 包裹（由 remark-rehype 生成的 table/th/td 不带 CSS Module hash）

## 移动端

将 table 包裹在 `overflow-x: auto` 容器中（或在 table 本身设置），避免窄屏溢出。
