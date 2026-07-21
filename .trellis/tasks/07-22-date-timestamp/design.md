# 日期时间戳方案设计

## 1. 新增 parseDate 工具函数

在 `build-posts.js` 中添加辅助函数，统一解析两种 frontmatter 日期格式：

```javascript
function parseDate(str) {
  // 纯日期（如 2026-07-22）→ 按北京时间解析
  // 带时间的（如 2026-07-22 10:30:00）→ 直接解析
  return /[\sT]/.test(str) ? new Date(str) : new Date(str + 'T00:00:00+08:00')
}
```

## 2. 未来日期过滤（build-posts.js:349）

当前：
```javascript
if (new Date(data.date + 'T00:00:00+08:00') > new Date())
```

改为：
```javascript
if (parseDate(data.date) > new Date())
```

## 3. 排序（无需改动）

当前 `new Date(b.date) - new Date(a.date)` 对两种格式均有效。带时间后同一天天然有序，slug 二级排序退化为几乎用不到的防呆措施。

## 4. RSS feed（无需改动）

`new Date(p.date).toISOString()` — 纯日期输出 `2026-07-22T00:00:00.000Z`，带时间输出精确时间戳。

## 5. 页面展示（无需改动）

`new Date(meta.date).toLocaleDateString('zh-CN')` — 只取日期部分，不影响。

## 6. 模板标注

在 `Templates/` 中标注推荐格式：
```yaml
---
# 推荐（带时间，精确排序）：
date: 2026-07-22 10:30:00
# 兼容（仅日期）：
# date: 2026-07-22
---
```

## 变更汇总

| 文件 | 改动 |
|------|------|
| `scripts/build-posts.js` | 新增 `parseDate()` + 替换一行未来日期判断 |
| `Templates/*.md` | frontmatter 注释标注时间格式 |
