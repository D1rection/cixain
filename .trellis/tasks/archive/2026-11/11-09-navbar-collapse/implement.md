# 顶部导航收起展开实施计划

前置：作者确认本 PRD 与设计后执行 `python3 ./.trellis/scripts/task.py start 11-09-navbar-collapse`。

## 改动清单（4 个文件，1 新增 3 修改）

### 1. 新增 `src/hooks/useScrolledFromTop.js`

- 默认导出 `useScrolledFromTop(target, resetKey)`，返回布尔值（是否已离开顶部）。
- 内部常量 `COLLAPSE_AT = 8`、`EXPAND_AT = 2`；只此一处定义。
- 逻辑按 design.md §4：passive 监听 + rAF 合并 + 滞回 + 订阅时同步读一次 + `resetKey` 变化时渲染期复位。
- 文件头 JSDoc 说明「阈值成对出现是为了滞回，不要单独调大其中一个」。
- 不做 SSR 分支判断（`target` 为 null 时天然不订阅）。

### 2. 修改 `src/components/NavBar.jsx`

- `const { target } = useScrollTarget()`；`const scrolled = useScrolledFromTop(target, location)`。
- `const hideNav = scrolled && !menuOpen`（`location` 已有，菜单开关复用现有 state）。
- `<nav data-collapsed={hideNav || undefined} inert={hideNav || undefined}>`，其余结构、类名、事件不动。
- 不新增 useEffect。

### 3. 修改 `src/components/NavBar.module.css`

- `.nav`：`position: sticky; top: 0` → `position: relative`；新增 `--nav-h: 53px`；加 `transition: margin-top 280ms cubic-bezier(.4,0,.2,1)`。
- 新增 `.nav[data-collapsed] { margin-top: calc(-1 * var(--nav-h)); }`。
- `@media (max-width: 480px)` 内补 `.nav { --nav-h: 49px; }`。
- 新增 `@media (prefers-reduced-motion: reduce)` 关闭该过渡。
- 注释说明 `--nav-h` 与 `.inner` 高度必须同步。
- 其余规则（菜单 `top: 52px/48px`、断点、主题变量）不动。

### 4. 修改 `src/components/BackToTop.jsx`

- 删除 `THRESHOLD = 300` 与该组件自己的 scroll 监听。
- 改为 `const scrolled = useScrolledFromTop(target, location)`，`visible = scrolled`。
- 保留 `scrollToTop`、类名与无障碍属性；`useLocation` 从 wouter 引入。

## 验证

### 开发环境

```
npm run dev
```

逐条对照 PRD 验收标准 1–9：

1. 顶部：导航显示、按钮消失。
2. 滚 20px：导航 280ms 上滑、正文补位、按钮淡入；滚动条位置不跳。
3. 回到顶部：反向播放；按钮淡出。
4. 8px 附近小幅来回滚动：无闪烁（可用 `scrollTop` 逐像素微调复现）。
5. 手机宽度 + 汉堡菜单展开后滚动：导航不收起；关闭后收起。
6. 从文章中部点击导航进入 `/archive`：新页面首帧展开。
7. 收起后按 Tab：焦点不进入导航，页面不位移（重点看 `#root` 没有发生内部滚动）。
8. 系统开启「减弱动态效果」：状态直接切换。
9. 320 / 480 / 768 / 769 / 1200 / 宽屏，深色 + 浅色主题各看一遍；重点看收起瞬间边框与阴影是否撕裂、壁纸透出是否正常。

另外确认：

- 阅读进度条在收起后于顶部露出，符合 PRD 默认值。
- 图片预览 / 搜索浮层打开时滚动被锁，导航状态不受影响。

### 构建

```
npm run build
```

- 构建成功；静态页首屏导航为展开态，控制台无 hydration 警告。
- 抽查 `dist` 首页与一篇文章：`<nav>` 上没有 `data-collapsed`/`inert`。

## 风险与回滚

| 风险 | 处理 |
| --- | --- |
| `margin-top` 每帧触发布局，低端设备掉帧 | 只影响 280ms 一次的切换；真机不顺再考虑 `steps()` 或改合成层方案（需重新评估壁纸带问题） |
| iOS Safari 惯性滚动中切换 | 真机验证；必要时把切换阈值调到 > 53px，避开惯性最活跃的区间 |
| `--nav-h` 与实际高度漂移 | 常量与 `.inner` 高度同文件相邻，改动时同步；PRD 验收 2 会暴露偏差 |
| 需要回滚 | 4 个文件独立改动，`git revert` 单个提交即可；无数据/构建产物影响 |

## 提交

- 分支：`feat/navbar-collapse`（待确认是否新建分支）。
- 提交信息：`feat: 导航滚动收起`（Angular 规范，≤10 字）。
- 推送前单独询问。
