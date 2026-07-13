# PRD: 图片语法支持位置和大小控制

## 需求

目前 markdown 图片 `![](url)` 编译后左对齐、无尺寸控制。需要扩展语法，让用户在 markdown 中指定图片的位置和对齐方式。

## 方案

**默认行为**：所有图片自动居中、`max-width: 100%`，由 CSS 保证。

**扩展语法**：自定义 remark 插件，解析 Obsidian 风格管道语法：

```markdown
![alt|position width](url)
```

- `![alt](url)` — 默认居中
- `![|center 400](url)` — 居中 + 宽度 400px
- `![|right 300](url)` — 右浮动 + 宽度 300px
- `![|left 300](url)` — 左浮动 + 宽度 300px
- `![|400](url)` — 仅指定宽度，居中
- `![|right](url)` — 仅指定位置，不限制宽度

## 改动范围

| 文件 | 改动 |
|------|------|
| `scripts/build-posts.js` | 新增自定义 remark 图片插件 |
| `src/components/PostContent.module.css` | `img` 默认居中 + 位置 utility 类 |

## 验收标准

1. `![](url)` 编译后 `img` 包裹在 `p.text-center` 中，水平居中显示
2. `![|right 300](url)` 编译后 `img` 带 `width: 300px`、`float: right`
3. `![|center 400](url)` 编译后 `img` 居中、`width: 400px`
4. pure width `![|500](url)` 仅设宽度，居中
5. pure position `![|left](url)` 仅设置浮动
