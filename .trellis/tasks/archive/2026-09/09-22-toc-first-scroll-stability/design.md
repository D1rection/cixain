# TOC 首次跳转稳定性修复设计

## 推荐决策

增加短期客户端定位会话：立即平滑滚动，滚动结束后根据实际标题位置校正，最长跟踪 3 秒，用户操作立即取消。

精确比例占位能从根源减少布局变化，但 content-pipeline.md 明确约定尺寸由作者声明、构建零网络、缺高度使用 4:3 占位。旧文章与历史正文普遍仅写宽度。本次保留此约定，增强目录导航对布局变化的容错。

| 方案 | 收益 | 取舍 |
| --- | --- | --- |
| 获取真实比例并预留 | 同时解决一般阅读中的图片布局偏移 | 需尺寸清单、采集和缓存，改变已有构建约定；适合作为后续任务 |
| 等目标前全部图片加载 | 开始滚动时位置更确定 | 需主动加载远处图片，否则懒加载可能永不触发；长文等待和流量大 |
| 固定延迟后补跳一次 | 实现简单 | 网络和多图时序不确定，不能保证一次足够 |
| 有界定位会话（推荐） | 立即响应、兼容旧文章、无需额外图片请求 | 窗口内可能有小幅校正；超时后不保证迟到图片不偏移 |

## 文件与边界

- 新增 src/hooks/useTocScroll.js，封装导航会话及清理；仅 TOC 使用。
- TableOfContents.jsx 接入 hook，传入已有 contentRef、target、toc；保留链接 preventDefault 和 hash/history 行为。
- 保留标题 scroll-margin-top:60px。移动端对齐容器顶部加 60px，桌面对齐视口顶部加 60px，不重新设计留白和高亮。
- 不改 build-posts.js、Markdown、图片 CSS 或懒加载库；不重构 useHashScroll 和 RevisionReader 的导航。

## 会话状态与数据流

1. 在 contentRef 内解析标题，验证连接状态，取消旧会话，生成请求 ID。异步回调均校验 ID、标题和滚动目标。
2. 滚动前挂载监听，计算目标坐标，对明确的 target 调用 scrollTo；初次使用 smooth，减少动态效果时使用 instant。
3. 初次动画期间记录布局变化但不反复重启动画。以 scrollend 判定动画结束，另设 scroll 静默 150ms 回退；首次调用后也启动回退，覆盖没有位移、不触发 scrollend 的情况。不能在动画启动前仅凭空闲帧提前校正。
4. 动画结束后计算实际误差，超过 2px 才 instant 校正，不再启动平滑动画。
5. 会话中 ResizeObserver 观察正文、容器、目标前图片；正文捕获 load/error 也触发重测。通知合并为单个 requestAnimationFrame，避免观察回调中同步读写循环。只在进入校正阶段后写滚动位置。
6. 有未落定的前置图片时，保留会话至最长时限，即使该图片尚未进入加载区域；不主动加载全篇。所有前置图片成功或失败、动画结束且布局稳定 150ms 后可提前结束。点击起最长 3000ms，到期若动画已完成则最后测量校正一次并清理，否则直接清理，不反复打断仍在执行的动画。

img.complete 不能代表真实图片加载完成：SVG 占位图也为 true。状态要区分占位、真实源加载中、loaded 和 error。错误替换 ERROR_URI 后可能再次改变高度，应在替换后的布局帧检查。普通非 lazy 图片结合 complete、naturalWidth 和 error 事件处理。

## 坐标契约

- window：desired = scrollY + headingRect.top - scrollMarginTop。
- 元素：desired = scrollTop + headingRect.top - containerRect.top - container.clientTop - scrollMarginTop。
- 将 desired 钳制到 [0, scrollHeight-clientHeight]；window 使用 scrollingElement 和视口高度。误差以实际 scroll offset 与钳制后的 desired 比较，避免文章末尾不可对齐时循环。
- 不再额外减 Navbar 高度，防止移动端重复扣除。首次与修正共用算法，允许 2 CSS px 取整误差。

## 取消与清理

- wheel、touchstart、后续 pointerdown（含拖动滚动条）、滚动相关 keydown 取消未来校正；不 preventDefault，不干扰输入框普通编辑。
- 新 TOC 点击取消旧会话后创建新会话，初始点击自身不能误取消新会话。
- 路由卸载、正文/toc 引用变化、target 变化、窗口尺寸变化或其他导航操作取消，不自动重启。
- 清理 observer、事件、计时器及 rAF，结束函数幂等。禁止常驻逐帧扫描。

## 限制与回滚

3000ms/150ms 是初始设计值，实施时使用命名常量并实测。超过窗口才完成的图片仍可能偏移，这是有限校正的明确边界；若要求任意慢网下完全稳定，应选择精确尺寸占位的更大方案。

之前“滚动容器没有问题”的结论只在已测 601px 路径得到支持，桌面及其他浏览器仍需验证。移除新 hook 接入、恢复原 scrollIntoView 即可回滚，无数据迁移。
