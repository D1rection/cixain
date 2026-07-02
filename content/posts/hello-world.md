---
title: Hello World
date: 2026-06-23
description: 第一篇博客文章
category: Tech
tags: [blog, react]
---

## 欢迎

这是我的第一篇博客文章。

### 代码示例

```js
console.log('Hello, world!')
```

### TabGroup 标签页

```react:TabGroup
--方法一--
使用 `forEach` 遍历数组，可以对每一项执行回调

--方法二--
使用 `map` 转换数组，返回一个新数组

--对比--
`forEach` 无返回值，`map` 返回新数组，根据需要选择
```

### CodeCompare 代码对比

```react:CodeCompare
// 之前的写法
function init() {
  console.log('start')
  process()
  console.log('end')
}
---
// 新的写法
async function init() {
  console.log('start')
  await process()
  console.log('end')
}
```

### FlashCard 闪卡

```react:FlashCard
React 组件通信有哪些方式？
---
props 传参、Context、回调函数、状态提升、useReducer
```

> 引用块测试
