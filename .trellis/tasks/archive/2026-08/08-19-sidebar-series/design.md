# Design — 侧栏系列区块

## 1. 数据与排序

```js
// Sidebar.jsx：与 allTags 同法提取
const seriesList = useMemo(() => {
  const byName = new Map()           // name -> posts[]
  posts.forEach(p => { if (p.series) (byName.get(p.series) ?? byName.set(p.series, []).get(p.series)).push(p) })
  return [...byName.entries()]
    .map(([name, list]) => ({ name, count: list.length, latest: Math.max(...list.map(p => +new Date(p.date))) }))
    .sort((a, b) => b.latest - a.latest)   // 系列内最新文章日期降序
}, [posts])
```

`useMemo` 依赖 posts；latest 取系列内最大文章时间戳（与 sortSeries 无关，仅排序用）。

## 2. 渲染（Sidebar.jsx）

```jsx
{seriesList.length > 0 && (
  <div className={styles.section}>
    <p className={styles.heading}>系列</p>
    {seriesList.map(s => {
      const active = location === `/series/${encodeURIComponent(s.name)}`
      return (
        <Link
          key={s.name}
          href={`/series/${encodeURIComponent(s.name)}`}
          className={`${styles.seriesLink} ${active ? styles.seriesActive : ''}`}
        >
          <span className={styles.seriesName}>{s.name}</span>
          <span className={styles.seriesCount}>{s.count}</span>
        </Link>
      )
    })}
  </div>
)}
```

高亮判定：与分类一致用 `location ===` 精确匹配（FilteredList 路径即 `/series/<slug>`，useLocation 返回 URL 字符串）。
**可达性注**：`Layout sidebar={isHome}` —— 侧栏只在首页渲染，分类/系列筛选页视图无侧栏；高亮匹配逻辑与分类同款保留（成本为零），实际可见场景仅首页 `/`（高亮分类「全部」）。

## 3. 样式（Sidebar.module.css）

```css
.seriesLink {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 4px 0;
  font-size: 0.9rem;
  color: var(--color-text);
  text-decoration: none;
}
.seriesLink:hover { color: var(--color-accent); }
.seriesActive { color: var(--color-accent); }
.seriesCount { font-size: 0.75rem; color: var(--color-muted); }
```

- 与 `catLink` 同字号/同 hover/同高亮体系，仅多一个靠右的篇数（flex space-between）。
- `.seriesActive` 下 count 仍 muted（主次分明）。

## 4. 位置

结构中插在「分类」与「标签」之间：分类（静态）→ 系列（动态、中频）→ 标签（高频、最多）。

## 5. 边界

| 场景 | 行为 |
|------|------|
| 无系列文章 | seriesList 空 → 区块整个不渲染 |
| 系列名含空格/特殊字符 | `encodeURIComponent` 构造 href；FilteredList `useRoute` 自动解码，`sortSeries(posts, slug)` 按解码后的原名匹配 ✓ |
| 系列筛选页 | active 高亮 ✓ |
| 移动端 | 侧栏隐藏（现有 `@media` 不动） |
| 与其他区块 | 无样式耦合；区块隔离 |

## 6. 风险

- 低风险：纯展示组件，无数据/路由改动；回滚单文件。
- 排序稳定性：两系列最新日期相同（同批量 8-13 提交）→ 非稳定时可加名称次排序（补充即可）。