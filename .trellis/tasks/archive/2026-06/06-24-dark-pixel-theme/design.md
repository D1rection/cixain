# 设计

## CSS 变量结构

```css
:root, [data-theme="light"] {
  --color-bg: #ffffff;
  --color-text: #1a1a1a;
  --color-muted: #6b7280;
  --color-accent: #2563eb;
  --color-border: #e5e7eb;
  --color-card-bg: #ffffff;
}

[data-theme="dark"] {
  --color-bg: #0a0a0a;
  --color-text: #e5e5e5;
  --color-muted: #6b7280;
  --color-accent: #00ff41;
  --color-border: #1f2937;
  --color-card-bg: #111111;
}
```

## 像素字体

Press Start 2P（Google Fonts），仅用于 `cixain` 品牌名，15px。

## 扫描线背景

暗色模式下，用 CSS 伪元素 + repeating-linear-gradient 模拟 CRT 扫描线：
```css
[data-theme="dark"]::before {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.15) 2px,
    rgba(0,0,0,0.15) 4px
  );
  pointer-events: none;
  z-index: 9999;
}
```

## 主题切换

- `src/hooks/useTheme.js` — 读取/写入 localStorage + 监听系统偏好
- 默认：`prefers-color-scheme` → localStorage 覆盖
- NavBar 中加一个切换按钮，月亮/太阳图标
