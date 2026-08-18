# PRD: 代码块行号

## 问题

代码块目前没有行号，阅读时难以定位和引用特定行。

## 方案

利用 Shiki 的 `transformers` 机制，给每行代码注入 `data-line` 属性，然后通过 CSS `::before` 伪元素显示行号。

### 改动范围

| 文件 | 改动 |
|------|------|
| `scripts/build-posts.js` | Shiki 配置加 `transformers`，`line` hook 注入 `data-line` |
| `src/components/PostContent.module.css` | `.shiki .line::before` 显示行号，移动端隐藏 |

### 详细设计

**`scripts/build-posts.js`**:
```js
.use(rehypeShiki, {
  themes: { light: 'github-dark', dark: 'github-dark' },
  transformers: [{
    line(node, line) {
      node.properties['data-line'] = line
    }
  }],
})
```

**CSS**:
- 行号用 `::before` 伪元素 + `attr(data-line)`
- 右侧对齐，2em 宽度
- 半透明，不可选中
- ```@media (max-width: 768px)``` 下隐藏
