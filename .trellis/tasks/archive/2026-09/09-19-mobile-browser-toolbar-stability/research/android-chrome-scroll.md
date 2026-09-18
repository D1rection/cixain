# Android Chrome 浏览器工具栏稳定性调研

日期：2026-09-19。依据：当前仓库静态阅读、本次会话官方资料与 Chromium 源码阅读。未完成真机验证。

## 用户确认
- 目标是浏览器地址栏／工具栏，不是网站 NavBar。
- 目标平台 Android Chrome，具体版本尚未提供。
- 采用 html/body 固定视口尺寸 + overflow:hidden + 独立滚动容器作为设计起点。
- 用户授权开 Trellis 设计方案，未要求立即实现。

## 证据与推断
1. Chromium 的 global rootScroller 负责工具栏显隐；div 可以被隐式提升为 rootScroller。因此“不是 body 滚动”不等于“一定不会收缩地址栏”。
   来源：https://chromium.googlesource.com/chromium/src/+/HEAD/third_party/blink/renderer/core/page/scrolling/README.md
2. 本轮通过 Gitiles main 的 base64 源码读取 root_scroller_controller.cc：FillsViewport 检查尺寸及视口原点；IsValidImplicit 在非 LayoutView 的 containing-block 祖先存在 overflow 裁剪、mask 或 clip 时拒绝提升。
   来源：https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/core/page/scrolling/root_scroller_controller.cc
   推断：保留 position:relative + overflow:hidden 的 #root 外壳，在其内设置独立滚动容器，能避开当前实现的隐式提升。来源是可变化的 main，不是已确认的用户安装版本保证。
3. overscroll-behavior 用于控制边界滚动链和下拉刷新，不是锁定地址栏的专用属性。
   来源：https://developer.chrome.com/blog/overscroll-behavior
4. Chrome Android 除地址栏外还有可能动态变化的底部系统手势区域配合层（chin）；真机验证应观察整体浏览器 UI，不仅顶部地址栏。
   来源：https://developer.chrome.com/docs/css-ui/edge-to-edge

## 仓库影响
- global.css：html 和 #root 的 min-height:100vh；移动端 body overflow-x:hidden；背景为 body 固定伪元素。
- App.jsx：NavBar、Layout、Footer 当前并列；SearchOverlay 和 BackToTop 位于根层；ImagePreview portal 到 body。
- ReadingProgress/BackToTop/ScrollToTop/TableOfContents 直接读取或监听 window 滚动。
- ImagePreview 用 body.preview-open 锁滚动；SearchOverlay 当前没有等价正文锁。
- useHashScroll 使用 scrollIntoView 居中，useHeadingAnchors 写入 60px scroll-margin-top。
- lazyImages 的 vanilla-lazyload 使用默认观察根，不能在未验证前断言容器滚动会导致懒加载失效。

## 未验证项
工具栏是否完全不收缩、Chrome 版本差异、工具栏已收起状态进入页面、旋转/软键盘/返回恢复、下拉刷新变化，均需真实 Android Chrome 测试。window.scrollY 为零与桌面设备模拟不能作为工具栏稳定的充分证据。
