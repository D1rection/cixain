# PRD: 主题图标水合修复

## 问题

`useTheme` 在 SSR 中用 `getStored()` 读取 localStorage → 永远返回 `null` → `useState(null)` → 水合后 `saved` 还是 `null` → 图标始终显示 auto，不反映用户保存的主题。

## 方案

`useTheme` 的初始状态改为从 DOM 的 `data-theme` 属性读取（inline script 已正确设置），而非 localStorage。

改动范围：

| 文件 | 改动 |
|------|------|
| `src/hooks/useTheme.js` | 初始值从读 localStorage 改为读 `data-theme` |
