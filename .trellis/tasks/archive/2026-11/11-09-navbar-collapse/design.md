# 顶部导航收起展开技术设计

状态：待作者确认（2026-11-09）。

## 1. 现状结构（决定了实现方式）

```
#root  (flex column, height:100%, overflow:hidden)
├─ <nav class=nav>            ← 在文档流里，flex: 0 0 auto
└─ <div class=container>      ← ScrollContainer，overflow-y:auto，真正滚动的地方
```

- 滚动发生在 `ScrollContainer`，不在 `window`；`useScrollTarget()` 返回该容器。
- 导航是 `#root` 的兄弟节点，**不覆盖内容**，因此「收起」必须让出高度，否则内容不会上移，顶部会留一条 53px 的壁纸带。
- `NavBar.module.css` 的 `position: sticky; top: 0` 在现有结构下是死代码（`#root` 不滚动）。

## 2. 已实测的前置结论（必须一起改）

用同构最小复现（`#root` flex + overflow hidden、`nav sticky top:0`、`margin-top:-53px`）验证：

| 导航定位 | 收起后 navTop | 收起后 contentTop | 结果 |
| --- | --- | --- | --- |
| `sticky; top: 0` | 0 | 0 | sticky 把负 margin 顶回原位，导航压住内容，动画失效 |
| `relative` | -53 | 0 | 导航整体移出视口，内容补位，符合预期 |

结论：**必须去掉 `position: sticky`**（改为 `relative` 或静态定位）。该声明当前无运行时作用，移除不影响其他行为。

## 3. 动效实现

单一属性 `margin-top: 0 → calc(-1 * var(--nav-h))`：

- 导航连同背景、边框、阴影一起上滑；`#root` 的 `overflow: hidden` 负责裁剪（实际上移出视口的区域本来就在屏幕外，裁剪只是兜底）。
- flex 容器同步长高 53px，内容随动画上移，视觉上是「收起 + 正文补位」。
- 导航自身尺寸不变，`backdrop-filter` 不会逐帧重算；每帧只发生一次 `#root` 的布局变化（滚动容器宽度不变，子树不重排），量级可接受。
- 不用 `translateY(-100%)`：合成层动画虽便宜，但不让出高度，顶部会留下一条未模糊的壁纸带。

```css
.nav {
  --nav-h: 53px;                 /* .inner 52px + 1px 边框 */
  position: relative;            /* 不能留 sticky */
  transition: margin-top 280ms cubic-bezier(0.4, 0, 0.2, 1);
}
.nav[data-collapsed] { margin-top: calc(-1 * var(--nav-h)); }

@media (max-width: 480px) { .nav { --nav-h: 49px; } }
@media (prefers-reduced-motion: reduce) { .nav { transition: none; } }
```

`--nav-h` 与 `.inner` 的高度是同一个事实的两处表达，改动 `.inner` 高度时必须同步（在 CSS 里就地注释说明）。不用 JS 量高度：一个 53px 的常量不值得引入 `ResizeObserver`。

## 4. 状态来源：`useScrolledFromTop`

新增 `src/hooks/useScrolledFromTop.js`，语义是「页面是否已离开顶部」，导航与按钮都消费它，阈值只有一份。

```js
const COLLAPSE_AT = 8
const EXPAND_AT = 2

export default function useScrolledFromTop(target, resetKey) { ... }
```

契约：

- `target` 来自 `useScrollTarget()`；`null` 时不订阅，`ready` 后重新订阅。
- `scroll` 监听为 passive，回调合并进 `requestAnimationFrame`，卸载时 `cancelAnimationFrame`。
- 滞回：当前为 false 且 `y > 8` → true；当前为 true 且 `y <= 2` → false；区间内保持。
- 订阅时先同步读一次，覆盖「挂载时已经在滚动位置」的情况。
- `resetKey`（路由 location）变化时在**渲染期**把状态复位为 false（React 的 adjust-state-on-prop-change 模式），保证新页面首帧就是展开态；若只在 effect 里复位，会晚一帧，出现收起→展开的抖动。
- 结果只有布尔值，`setState` 相同值不会触发重渲染。

消费方式：

- `NavBar`：`const scrolled = useScrolledFromTop(target, location)` → `hideNav = scrolled && !menuOpen`。
- `BackToTop`：`const scrolled = useScrolledFromTop(target, location)` → `visible = scrolled`。

两个消费者各自订阅同一个 target、同一份阈值，滚动事件同帧结算，不会出现两者状态不一致。不为此引入 Provider 层级：为一个布尔值包一层 context 的复杂度高于收益；若将来出现第三个消费者再抽 context。

## 5. 可访问性与边界

- 收起时给 `<nav>` 加 `inert`（React 19.2 支持布尔 `inert`）。理由不只是语义：导航在视口外仍可聚焦，Tab 到它时浏览器会滚动 `overflow: hidden` 的 `#root` 去露出焦点，整页会突然下移 53px。`inert` 同时挡住点击与键盘。
- `inert` 只在真正收起时生效；菜单展开期间 `hideNav` 恒为 false，菜单仍可交互。
- 路由切换：`ScrollToTop` 的 layout effect 先于被动 effect 执行，会把 `scrollTop` 归零并触发 scroll 事件；`resetKey` 复位是双保险。
- 收藏的滚动位置 / 刷新：滚动在 `div` 内，浏览器不会恢复该容器的滚动位置，挂载时恒为 0，首帧展开，无 hydration 差异。
- SSR：`data-collapsed={hideNav || undefined}` 在未收起时不输出属性，服务端与客户端首帧一致。

## 6. 明确不做

- 滚动方向判断、鼠标靠近顶部唤出、滚动容器的通用状态提升。
- 调整 `ReadingProgress` 的 z-index 或位置（导航收起后它自然露出，见 PRD 默认值）。
- 任何 `window` 级滚动监听（本项目滚动目标不是 window，保留 `useScrollTarget` 的抽象）。
