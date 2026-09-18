# 技术设计

## 布局调整

目标结构：

```text
#root（flex column；移动端固定视口并裁剪溢出）
├── NavBar（flex: 0 0 auto；不属于正文滚动区域）
└── ScrollContainer（flex: 1；移动端唯一纵向滚动目标）
    ├── Layout / 当前页面
    └── Footer
```

`ScrollProvider` 继续包住整个 App，使 Navbar 外部的 `ScrollToTop`、`BackToTop`、搜索和图片预览能够取得同一个活动滚动目标。只移动 JSX 层级，不移动滚动上下文或重新实现滚动监听。

移动端 `#root` 仍使用 `height: 100%` 和 `overflow: hidden`，Navbar 占用固定高度后，ScrollContainer 通过 `flex: 1; min-height: 0` 获得剩余高度。桌面端恢复现有页面高度和 window 滚动语义，Navbar 作为根布局的普通首项，滚动正文时保持在视口顶部布局中。

## 组件与样式

- `src/App.jsx`：将 `<NavBar />` 放到 `<ScrollContainer>` 前面；保留 `Layout + Footer` 在容器内。
- `src/components/ScrollContainer.module.css`：确保容器的 flex 高度计算在 Navbar 成为兄弟节点后仍正确；移动端继续 `overflow-y: auto`，桌面端继续不截断自然页面高度。
- `src/components/NavBar.module.css`：只在真机／经典滚动条验证出现宽度问题时调整，不添加滚动条宽度补偿；菜单 fixed 层需验证不受 root 裁剪。
- 其余使用 `useScrollTarget()` 的组件不改 API。Navbar 不需要读滚动位置。

## 验证重点

- 检查 `.nav.getBoundingClientRect().width` 是否等于视口宽度，检查 `.container.clientWidth` 是否因经典滚动条变窄但不影响 Navbar。
- 移动端验证容器 `scrollTop` 变化而 `document.documentElement.scrollTop` 保持 0。
- 在响应式宽度 480px、599px、768px、769px 和桌面宽屏检查 Navbar、菜单与正文高度。
- 使用真实存在经典滚动条的浏览器进行视觉确认；桌面模拟或 overlay scrollbar 只能证明布局关系，不能覆盖该验收项。
- 不使用 `scrollbar-width: none`、`::-webkit-scrollbar { display: none }` 或负 margin 伪造全宽。
