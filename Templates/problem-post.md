# 题帖模板（一题一帖）

复制本文件到 `content/posts/YYYY-MM-DD-NNN.md`，按注释填写。

## 1. 完整示例（LeetCode）

```markdown
---
title: "LC-1 两数之和"      # 标题带题号前缀，列表/搜索直达
date: "YYYY-MM-DD"
description: "<一句话：算法要点>"
category: Tech
tags: [算法, LeetCode, 二分]
source: LeetCode            # ← meta 一个信息点一个空，页面顶部渲染
difficulty: Easy
url: "https://leetcode.cn/problems/<slug>/"
draft: true                 # 完成后再去掉
---

> [!fold] 题目描述
> <完整题干：markdown 直接写，公式/高亮/代码照常。示例/输入输出/约束都包含在原文里>
>
> （多段用 `>` 空行分隔，与 Obsidian callout 完全一致）

## 思路
(你的思考/关键观察：为什么想到这个解法，卡点在哪)

## 解法
(可复用 CodeCompare 双栏对比 / TabGroup 多解法切换)

## 复杂度
- 时间 / 空间

## 易错点
(边界、溢出、优先级等踩过的坑)

> 相关笔记：[[AG<序号> <知识笔记>]]
```

## 2. 字段速查

| frontmatter 字段 | 必填 | 说明 |
|---|---|---|
| `source` | 否 | 来源平台（LeetCode / CSP…），顶部信息条徽章 |
| `difficulty` | 否 | LC 三档有颜色（Easy/Medium/Hard），其余纯文本 |
| `url` | 否 | 原题链接，「原题 ↗」新窗口打开 |
| 其余 | — | 与普通文章完全一致（title/date/description/category/tags） |

## 3. 折叠块（> [!fold]）写作细节

- 每行以 `> ` 开头，段落之间用仅含 `>` 的行隔开——Obsidian callout 语法，Obsidian 与博客双端渲染
- 标题随文写：`> [!fold] 题目描述（Easy）`；空标题默认「题目描述」
- 块内是正常 markdown：`==高亮==`、`$公式$`、代码块、列表照常
- 不要写 raw HTML `<details>`（Obsidian 不认，博客管线也会丢弃）

## 4. CSP 差异

- 输入/输出格式、数据规模随题干一起写进折叠块（原文本来就包含）
- 时间/内存限制这类 OJ 页头信息可写进折叠标题：`> [!fold] 垦田计划（中等，1s/512MB）`