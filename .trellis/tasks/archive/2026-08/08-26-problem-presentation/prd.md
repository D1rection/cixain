# PRD：算法题帖呈现 — 平铺 meta + fold callout 折叠题干

## 需求（用户最终确认，逐字语义）

1. **题目基本信息**（来源平台、难度、url 等 meta）**直接写进 Obsidian frontmatter**，一个信息点一个空（平铺键值，非嵌套对象）。
2. **题目描述**（整个题干：描述 + 输入输出形式 + 约束等）做成**可折叠**；折叠入口必须是 **Obsidian callout** 语法（`> [!fold] …`，参考 [Obsidian Callouts](https://obsidian.md/help/callouts) / [论坛：callout 是 `<details>` 的 markdown 等价物](https://forum.obsidian.md/t/stripped-callouts-markdown-counterpart-to-html-details-tag/106779)），笔记内人类可写，禁止 raw HTML `<details>`。
3. 页面顶部渲染基础信息条（来源/难度/原题链接），折叠题干紧随其后，正文自由。
4. 交付 `Templates/problem-post.md` 模板 + 演示文章 `LC-231 2 的幂`（draft）。

## frontmatter 形态

```yaml
---
title: LC-231 2 的幂
date: "2026-08-26"
description: 位运算判断 2 的幂
category: Tech
tags: [算法, LeetCode, 位运算]
source: LeetCode        # ← 一个信息点一个空
difficulty: Easy
url: https://leetcode.cn/problems/power-of-two/
draft: true
---
```

## 正文形态

```markdown
> [!fold] 题目描述
> 完整题干（markdown，公式/高亮/代码照常）
> …
```

## 验收标准

- AC1：dev 下 `/blog/2026-08-26-001`：标题 → 基础信息条（LeetCode / Easy / 原题链接）→ 折叠题干（默认收起，摘要为 callout 标题）→ 思路/解法/易错点。
- AC2：展开后题干内 KaTeX 公式渲染正常；折叠无 JS 依赖。
- AC3：写作内容仅含平铺 YAML + callout markdown，无 JSON/嵌套对象/raw HTML。
- AC4：无 meta 字段的旧文章不渲染信息条、零回归；`npm run build` 通过。
- AC5：CSP 差异（输入/输出格式、时间/内存限制）在模板中给写作约定（题干内或折叠标题）。

## 范围外

列表/搜索题号解析、脚手架脚本、样例约束独立卡片（用户已否决）。