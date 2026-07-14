# PRD: 移动端图标导航

## 问题

移动端 navbar 展开后，文字链接「首页 归档 关于」挤在同一行，加上搜索/主题等图标显得拥挤。

## 方案

给三个导航链接加上 SVG 图标，桌面端保持文字，移动端（≤768px）隐藏文字只显示图标，统一成 icon 按钮风格。

### 改动范围

| 文件 | 改动 |
|------|------|
| `NavBar.jsx` | 每个链接内嵌 SVG icon + 文字，新增 `ICON_LINKS` |
| `NavBar.module.css` | 移动端 `.link` 改成图标按钮样式，文字隐藏 |

### 图标

| 链接 | 图标 |
|------|------|
| 首页 | 房子 SVG |
| 归档 | 文件夹 SVG |
| 关于 | 信息圈 SVG |

### 详细设计

**NavBar.jsx**:
```jsx
<Link href="/" className={...} onClick={closeMenu}>
  <svg class={styles.linkIcon}>... </svg>
  <span class={styles.linkText}>首页</span>
</Link>
```

**NavBar.module.css** (mobile):
```css
@media (max-width: 768px) {
  .link {
    padding: 8px;
    border-radius: 6px;
  }
  .linkText {
    display: none;
  }
}
```

这样桌面端显示「首页 归档 关于」，移动端只显示三个图标，和 GitHub/搜索/主题图标风格一致。
