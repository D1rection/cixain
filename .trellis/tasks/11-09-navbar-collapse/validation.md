# 实施与验证记录

日期：2026-11-09。用户已确认 PRD 与设计并授权实施。

## 实现结果

- 新增 `src/hooks/useScrolledFromTop.js`：passive 监听当前滚动目标 + `requestAnimationFrame` 合并 + 8/2 滞回 + 订阅时同步读一次 + 路由变化时渲染期复位。
- `NavBar` 消费该 hook，`hideNav = scrolled && !menuOpen`，收起时输出 `data-collapsed` 与 `inert`；结构、类名、交互未动。
- `NavBar.module.css`：`position: sticky` → `relative`（实测 sticky 会让负 margin 失效），新增 `--nav-h`（53px / ≤480px 49px）、`margin-top` 280ms 过渡、`prefers-reduced-motion` 关闭过渡。
- `BackToTop` 删除自有 300px 阈值与监听，改用同一 hook，与导航同时出现/消失。
- 无新增依赖、无构建脚本改动、无全局 CSS。

## 浏览器实测

dev（`localhost:5173`）与生产构建（`vite preview`，`localhost:4173`）分别验证，数值为 `getBoundingClientRect()` 实测：

| 场景 | 结果 |
| --- | --- |
| 顶部 | `navTop 0`、`contentTop 53`、`data-collapsed` 无、按钮 `opacity 0` |
| 滚到 100px | `navTop -53`、`contentTop 0`、`data-collapsed` + `inert`、按钮 `opacity 1`、`margin-top -53px` |
| 收起中间态（120ms） | `navTop -19.1`、按钮 `opacity 0.58`，确认是过渡而非瞬移 |
| 回到 5px | 保持收起（滞回生效） |
| 回到 1px | 展开，`navTop -51`（中间态）→ `0` |
| 390px 视口（`--nav-h` 49px） | 顶部 `contentTop 49`；收起 `navTop -49`、`contentTop 0` |
| 390px 打开汉堡菜单后滚到 300 | 导航保持展开（`contentTop 49`、菜单 `display: grid`）；关菜单后收起 |
| 路由切换（滚动 300 后跳 `/archive`） | 下一帧 `scrollTop 0`、`data-collapsed` 已移除，随后 `navTop -53 → 0` 播放一次展开 |
| 收起后 `link.focus()` | `activeElement` 停在 `BODY`，`#root.scrollTop` 保持 0，`scrollHeight === clientHeight` |
| reduced-motion | `transition-duration: 0s`，状态直接切换 |
| 文章页滚动 | 阅读进度条在顶部 3px 露出（符合 PRD 默认值），导航不再遮挡 |
| 控制台 | 生产构建无 hydration 警告、无 JS 错误 |

## 构建与测试

- `npm run build`：exit 0，SSG 全部页面生成。
- `dist/index.html`：`<nav aria-label="主导航">` 上无 `data-collapsed` / `inert`，与 `grep -c` 为 0 一致。
- `npm run test:content`：33/33 通过。
- `npm run test:revisions`：10/10 通过。
- `git diff --check`：通过。
- `task.py validate`：上下文清单有效。

## 与 PRD 的偏差

- 验收 6 原写「新页面首帧即为展开态」。实测状态在同一帧复位，但 CSS 会从上一页的 `-53px` 播放一次 280ms 下滑，内容同时下移 53px。按「路由切换等同于回到顶部」保留该动画，已同步修改 PRD 第 6 条。若需要硬切，可在路由变化后单帧关闭过渡，但时序需额外处理。

## 未实测

- 真实 iOS/Android 设备上的惯性滚动与 Safari `backdrop-filter` 表现。
- 真实读屏器（只验证了 `inert` 对焦点与滚动的影响）。
- 系统级 reduced-motion 开关（只通过 DevTools 模拟验证）。
