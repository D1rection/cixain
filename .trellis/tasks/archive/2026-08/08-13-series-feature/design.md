# 文章系列功能 — 技术设计

## 1. 数据流

```
frontmatter: series + seriesIndex
  → build-posts.js 解析 → posts.json 每篇含 series / seriesIndex 字段
  → 前端 useBlogData() 读取 → 系列页筛选 / 文章页面包屑 / PostEnd 分流
```

解析规则（build-posts.js buildPosts 循环内）：
```js
series: data.series || null,
seriesIndex: typeof data.seriesIndex === 'number' ? data.seriesIndex : null,
```

## 2. 系列排序（共用函数）

`seriesPosts(posts, name)`：过滤同系列 → 按 `(seriesIndex ?? Infinity, date)` 排序 → 返回数组。
「第 N 节」= 该文章在排序数组中的 index + 1。
非系列文章（无 series）自然不在任何系列中。

## 3. 路由与系列页

- App.jsx 新增 `<Route path="/series/:slug" children={() => <FilteredList type="series" />} />`
- FilteredList.jsx 增加 `type === 'series'` 分支：
  - 过滤：`p.series === slug`（slug 为 URL 解码后的系列名）
  - label / 标题：系列名；排序：系列顺序（非日期）
- 空态：与 tag 页一致（FilteredList 现有空态逻辑）

## 4. 系列上下文块（TableOfContents 顶部，最终形态）

`meta.series` 存在时，BlogPost 计算 `{name, pos, total}` 传给 `TableOfContents`，渲染在 ToC 面板**顶部**（桌面固定侧栏内、移动端「目录」折叠钮上方）：

- 样式：等宽字体名称（accent 色无下划线，hover 变淡）+ 分数（muted）+ 通栏 4px 细线进度（accent 实心比例填充，无分格）
- 桌面（≥1200px）：面板顶，滚动始终可见；移动端：meta 下方 20px 间距
- 无标题文章（toc 为空）但属系列时，ToC 仅渲染系列块
- 非系列文章不渲染

## 5. PostEnd 分流（最终形态）

```js
const seriesPosts = post.series ? sortSeries(posts, post.series) : []
const inSeries = seriesPosts.length > 1 && seriesPosts.some(p => p.slug === post.slug)
const prev = inSeries ? seriesPosts[sIdx - 1] : 全局 prev
const next = inSeries ? seriesPosts[sIdx + 1] : 全局 next
const related = 现有算法.filter(p => !(inSeries && seriesPosts.includes(p)))
```

- **系列 ≥2 篇**：`$ cd series` + `上一节`/`下一节` 方向标签（系列内升序，上一节 = 之前一篇）；相关推荐排除同系列；首/末篇对应方向不渲染
- **系列仅 1 篇**：退化为非系列行为（全局日期上下篇 + 全量相关推荐）——单篇系列无系列内语境，不砍全局导航
- 非系列：维持现状

## 6. 迁移（9 篇）

| 文章 | series | seriesIndex |
|---|---|---|
| ML1-1 … ML1-7（7 篇） | CS229 机器学习 | 1-7 |
| C1, C2（2 篇） | 图形学 | 1, 2 |
| AG1（1 篇） | 算法 | 1 |

仅追加 frontmatter 两行，不动正文。用脚本批量检查每篇标题编号 → 写入，人工核对。

## 7. 边界情况

| 场景 | 行为 |
|---|---|
| 无 series 字段 | 非系列，一切维持现状 |
| 有 series 无 seriesIndex | 系列内按日期排序 |
| 系列只有 1 篇 | 面包屑显示「· 第 1 节」；PostEnd 无上一节/下一节（首末同篇），相关推荐过滤该系列后只剩系列外文章 |
| 系列名含特殊字符/中文 | URL encodeURIComponent，与 tag 页一致 |
| 同系列缺号（seriesIndex 1,3,5） | 位置序号 = 排序后位置（1,2,3），非编号本身 |
