# Implement — 侧栏系列区块执行计划

## 1. 实施步骤

1. **Sidebar.jsx**：
   - `useMemo` 提取 seriesList（设计第 1 节，含 count/latest 排序）
   - 渲染「系列」区块（分类之后、标签之前）：seriesLink + seriesCount + active 高亮
2. **Sidebar.module.css**：追加 `.seriesLink / .seriesActive / .seriesCount`（设计第 3 节）。

## 2. 自验（gate 1）

- `npm run build` 通过
- dev 浏览器桌面端（>768px）：侧栏显示 系列（CS229 机器学习 7 / 图形学 2 / 算法 1），顺序 = CS229 → 图形学 → 算法
- 点击「图形学」 → `/series/图形学`：系列页列出 2 篇（seriesIndex 序）、侧栏该系列高亮
- 亮/暗主题样式一致

## 3. 回归（gate 2）

- 移动端 375px：侧栏仍隐藏、无横向溢出
- 分类/标签区块行为不变（首屏桌面截图对照）
- 无系列文章场景（临时构造空 posts 或借 dev 过滤）不渲染系列区——若不便构造，则以代码路径 review 代替

## 4. 完成后

- Phase 3.3 判断是否有 spec 更新（侧栏结构约定写入 component-guidelines？视情况）
- 提交 → 归档 → push 一次完成