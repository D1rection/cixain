# 技术设计

## 决策
采用用户确认的最小方案：html/body 固定为一个视口宽高并 overflow:hidden；#root 为不滚动的裁剪外壳；新增独立容器承载网站 NavBar、Layout 和 Footer。移动端启用容器滚动，桌面端继续 window 滚动。

不把“固定网站 NavBar”当成需求。网站 NavBar 留在容器中沿用 sticky，搜索／预览／回顶等浮层保持在正文滚动区域之外。阅读进度当前位于文章子树，可先保留其 fixed 定位；只有验证发现裁剪／层叠回归才移动到外层，不额外重构。

## DOM 与样式边界
```text
html / body（移动端限定宽高、overflow:hidden）
└── #root（已有 position:relative；移动端限定高度、overflow:hidden）
    ├── ScrollContainer（CSS Module）
    │   ├── NavBar（sticky）
    │   ├── Layout / Switch / 当前页面
    │   └── Footer
    └── ScrollToTop、BackToTop、SearchOverlay；ImagePreview 保留 body portal
```
- html/body 用 width:100%; height:100%; min-height:0; overflow:hidden。避免 100vw 导致滚动条宽度问题。
- #root 移动端 height:100%; min-height:0; overflow:hidden，覆盖现有 min-height:100vh；保持 position:relative 和既有层叠关系。
- 容器移动端 height:100%; min-height:0; overflow-y:auto; overflow-x:hidden; overscroll-behavior-y:contain。
- 容器延续纵向 flex 布局；保证 NavBar、Footer 不压缩，Layout 长内容不被压缩到不可达区域，短页面仍由 Layout 填充可用空间。
- 桌面端容器 flex:1，内容自然撑高，overflow:visible，不保留移动端固定高度；祖先恢复原有最小视口高度。CSS 控制断点，DOM 在 SSG 与客户端一致。
- 保留 body 背景伪元素。无需为本需求改变菜单定位；验证 sticky、backdrop-filter、fixed 子元素在新祖先链下的行为，有实际回归再修。
- 首选百分比高度链。100dvh 是必要时可评估的视口适配备选，不是地址栏锁定开关；不得因工具栏变化反复用 JS 写入 innerHeight。
- print 下解除 html/body/#root/容器的高度与 overflow 限制，完整输出文章。

## Chrome 行为依据与边界
Chromium 支持把符合条件的全屏 div 提升成根滚动容器，根滚动容器仍可驱动工具栏。因此不能只把 #root 改成 overflow:auto。
本方案保留一个 position:relative、overflow:hidden 的非根裁剪祖先 #root。当前源码 IsValidImplicit 会排除拥有裁剪祖先的候选，意图让正文保持普通元素滚动。配合 overscroll-behavior-y:contain 阻断边界滚动链。
这是基于实现的可验证推断，不是浏览器公开保证。真机工具栏行为是验收依据，window.scrollY===0 仅为辅助观测。

## 滚动目标的统一契约
使用一个小型 ScrollContainer／配套 hook 或 context 封装；不引入第三方滚动库。具体文件名实施时按项目惯例确定。
- getTarget：≤768px 返回容器 DOM，桌面返回 window。SSR 不访问 window/document。
- getMetrics：返回 top、scrollHeight、viewportHeight。移动读取元素 scrollTop/scrollHeight/clientHeight；桌面读取 window.scrollY/documentElement.scrollHeight/innerHeight。
- scrollTo：统一分派，支持即时与 smooth。
- subscribe：监听实际滚动源，passive；卸载或媒体查询变化时解绑旧源、绑定新源，立即刷新。
- lock：搜索和图片预览共享背景滚动锁，关闭一个浮层不误解锁另一个。移动锁容器，桌面锁原页面；恢复旧样式和位置。断点变化期间锁跟随当前滚动目标。
- 断点变化：用上次记录的活动滚动位置转移到新目标，不能在 CSS 已把旧目标 scrollTop 清零后才读取；浏览器按新高度截断到有效范围即可，不承诺像素完全一致。

## 迁移清单
| 位置 | 设计 |
|---|---|
| App.jsx / global.css / 新容器 | 增加结构，移动端限定滚动边界，保持 SSR DOM 一致 |
| ReadingProgress.jsx | 使用活动目标计算比例；正文异步加载、图片高度和容器尺寸变化后重算，防止零除；沿用整页进度口径 |
| BackToTop.jsx | 使用活动目标判断 >300px 和执行 smooth 回顶 |
| ScrollToTop.jsx | 绘制前回顶当前目标，保留 hash 优先和现有 query 策略 |
| TableOfContents.jsx | 监听活动目标；以容器可视顶部加网站导航实际高度为高亮基准，消除固定 52px 在小屏的误差 |
| useHeadingAnchors / useHashScroll | scrollIntoView 可保留，检查标题 60px 留白与块引用居中；不可把 body 程序滚动引入正常跳转 |
| ImagePreview.jsx / SearchOverlay.jsx | 接入共享锁；搜索结果仍可独立滚动且边界不带动正文；不重做焦点系统 |
| lazyImages.js | 先保留现有 viewport IntersectionObserver。验证容器裁剪下加载和提前加载范围；只有证据显示需要时再设容器 root，并处理桌面切换 |
| CSS print | 解除高度及裁剪，防止打印只有首屏 |

所有新增组件样式用 CSS Modules，只有 html/body/#root 和打印等全局规则进入 global.css。API 文档查询与环境实际可用工具匹配，不凭旧 spec 的 react-router 描述替换当前 wouter。

## 验证与回滚
先在可撤销原型中只改结构/CSS，真机确认浏览器 UI 稳定，再完成功能迁移。原型期间滚动指标组件暂时失效不代表最终方案可交付。
浏览器桌面设备模拟只能验证布局和滚动源，无法证明 Android Chrome 工具栏行为。
若真机仍收缩，记录设备/版本和复现步骤，检查实际滚动源、祖先裁剪、滚动链；回到设计阶段，不用全局 touch 拦截、1px 尺寸 hack 或反复 scrollTo 强行补救。
回滚应作为整体撤回容器布局与滚动目标迁移，避免 CSS 回到 window 而监听仍留在容器。
