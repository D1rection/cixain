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
[
  {"label": "方法一", "content": "使用 forEach 遍历数组，可以对每一项执行回调"},
  {"label": "方法二", "content": "使用 map 转换数组，返回一个新数组"},
  {"label": "对比", "content": "forEach 无返回值，map 返回新数组，根据需要选择"}
]
```

### CodeCompare 代码对比

```react:CodeCompare
{
  "before": "function init() {\n  console.log('start')\n  process()\n  console.log('end')\n}",
  "after": "async function init() {\n  console.log('start')\n  await process()\n  console.log('end')\n}"
}
```

### FlashCard 闪卡

```react:FlashCard
{
  "front": "React 组件通信有哪些方式？",
  "back": "props 传参、Context、回调函数、状态提升、useReducer"
}
```

> 引用块测试
