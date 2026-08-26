---
title: "{{title}}"
# 标题带题号前缀，列表/搜索直达：LC-1 两数之和 / CSP202303-2 垦田计划
# 日期：推荐带时间 2026-08-26 10:30:00，兼容纯日期
date: "{{date}}"
description: ""                    # 一句话算法要点（列表卡片/SEO 摘要）
category: Soln                   # 题解分类：不进首页列表，仅从「题解」分类页进入
tags: [算法, LeetCode]             # 加主题标签：二分 / DP / 图论 / 位运算…
source: LeetCode                   # 来源平台：LeetCode / CSP / 牛客…
difficulty: Easy                   # LC 三档有颜色；CSP 写 中等 等纯文本
url: "https://leetcode.cn/problems/two-sum/"   # 原题链接，页面顶部展示
draft: true                        # 完成后去掉
---

> [!fold] 题目描述
> 给定一个整数数组 `nums` 和一个整数目标值 `target`，请你在该数组中找出 **和为目标值** `target` 的那 **两个** 整数，并返回它们的数组下标。
>
> 你可以假设每种输入只会对应一个答案。但是，数组中同一个元素在答案里不能重复出现。你可以按任意顺序返回答案。
>
> **示例 1：**
>
> 输入：`nums = [2,7,11,15], target = 9`
>
> 输出：`[0,1]`
>
> 解释：因为 `nums[0] + nums[1] == 9`，返回 `[0, 1]`。
>
> **示例 2：**
>
> 输入：`nums = [3,2,4], target = 6`
>
> 输出：`[1,2]`
>
> **示例 3：**
>
> 输入：`nums = [3,3], target = 6`
>
> 输出：`[0,1]`
>
> **提示：**
>
> - `2 <= nums.length <= 10^4`
> - `-10^9 <= nums[i] <= 10^9`
> - `-10^9 <= target <= 10^9`
> - 只会存在一个有效答案
>
> **进阶：** 你可以想出一个时间复杂度小于 $O(n^2)$ 的算法吗？

## 思路

（写你当时的思考：先想到什么、为什么不行、卡在哪、怎么绕出来）

## 解法

（多解法用 CodeCompare 双栏对比）

```react:CodeCompare
{
  "lang": "cpp",
  "beforeLabel": "暴力枚举",
  "afterLabel": "哈希表",
  "before": "for (int i = 0; i < n; i++)\n    for (int j = i + 1; j < n; j++)\n        if (nums[i] + nums[j] == target)\n            return {i, j};",
  "after": "unordered_map<int,int> mp;\nfor (int i = 0; i < n; i++) {\n    if (mp.count(target - nums[i]))\n        return {mp[target - nums[i]], i};\n    mp[nums[i]] = i;\n}"
}
```

## 复杂度

- 暴力枚举：时间 $O(n^2)$，空间 $O(1)$
- 哈希表：时间 $O(n)$，空间 $O(n)$

## 易错点

- 同一个元素不能重复使用：先查表、后插入，避免 `nums[i]` 与自己配对

> 相关笔记：[[AG<序号> <知识笔记>]]

<!--
## 折叠块（> [!fold]）写作细节

- 每行以 `> ` 开头，段落之间用仅含 `>` 的行隔开（Obsidian callout 语法；博客构建为默认收起的折叠块）
- 标题随文写：`> [!fold] 题目描述（Easy）`；空标题默认「题目描述」
- 块内是正常 markdown：`==高亮==`、`$公式$`、代码块、列表照常
- 示例/输入/输出/约束/数据规模都写进题干原文，不要在 frontmatter 重复
-->

<!--
## CSP 差异

- 输入/输出格式、数据规模随题干写进折叠块（原文本来就包含）
- 时间/内存限制可写进折叠标题：`> [!fold] 垦田计划（中等，1s/512MB）`
- frontmatter：`source: CSP`，`difficulty: 中等`（纯文本无色标），标题 `CSP202303-2 垦田计划`
-->