# PRD: remark-breaks 插件

## 需求

Obsidian 中单换行会产生视觉换行，但当前 remark-parse（CommonMark 标准）不保留单换行，所有内容挤在同一个 `<p>` 中。需要让博客渲染与 Obsidian 编辑视图对齐。

## 方案

在构建流水线中插入 `remark-breaks` 插件，将 md 中的单换行转为 `<br>`。

## 改动范围

| 文件 | 改动 |
|------|------|
| `scripts/build-posts.js` | 流水线插入 `remarkBreaks` |

## 验收标准

1. md 中的单换行编译为 `<br>` 而非合并到同一段落
2. 空行（段落分隔）不受影响，仍产生新 `<p>` 标签
3. 代码块内换行不受影响
4. 现有帖子渲染无明显异常
