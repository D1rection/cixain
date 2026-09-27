# 设计文章开篇总览 Callout

## Goal

定义一个适合放在文章开头的“总览” callout，让读者快速预览整篇文章的结构与阅读路线。

## Requirements

- 新增独立的 callout 语义，标记为 `overview`，默认标题为“总览”。
- 该 callout 用于概览文章整体脉络和阅读路线；正文由作者自由组织，不规定段落、列表形式或篇幅。
- 视觉上作为醒目的开篇横幅，与普通 callout 有清楚层级，同时沿用现有 callout 的设计语言。
- 将新类型接入可复制的 callout 模板与博客 Markdown 渲染。

## Acceptance Criteria

- [x] 模板包含 `[!overview] 总览` 用法示例，正文仍可使用常规 Markdown。
- [x] 博客生成的 HTML 带有独立的 `overview` callout 类型与路线图标。
- [x] 总览横幅在浅色与深色主题下均醒目、可读，并区别于普通 callout。
- [x] 现有 callout 的语义和样式保持不变。
