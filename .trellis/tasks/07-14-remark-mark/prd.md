# PRD: 支持 Obsidian ==高亮== 语法

## 需求

Obsidian 的 `==text==` 高亮语法在 blog 中未渲染，需要转为 `<mark>` 标签。

## 方案

在构建流水线中插入 `remark-mark` 插件，将 `==text==` AST 节点转为 `<mark>text</mark>`。

## 改动范围

| 文件 | 改动 |
|------|------|
| `package.json` | 新增 `remark-mark` |
| `scripts/build-posts.js` | 流水线插入 `remarkMark` |
| `src/styles/global.css` | 新增 `mark` 全局样式 |

## 验收标准

1. `==高亮文字==` 编译为 `<mark>高亮文字</mark>`
2. 页面中高亮文字有视觉反馈（黄色背景或主题色背景）
