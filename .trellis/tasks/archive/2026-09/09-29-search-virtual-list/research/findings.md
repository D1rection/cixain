# 调研记录（2026-09-29）

## 仓库事实
SearchOverlay 一次计算全部结果，再以 limit=10 和 slice 截取；更多按钮在滚动区外。方向键仅改变 activeIndex，没有滚动联动；所有结果链接均进入 Tab 顺序。索引首次打开获取并缓存，搜索同步计算，虚拟化不减少这些成本。App.jsx 静态导入 SearchOverlay，需观察依赖体积。现有测试只有 revisions 套件，无搜索浏览器测试基础设施。

## 官方依据
- https://tanstack.com/virtual/latest/docs/api/virtualizer ：提供全量 count、稳定 key、测量、范围提取、预渲染和滚动 API，允许保留视口外特定条目。
- https://tanstack.com/virtual/latest/docs/framework/react/examples/dynamic ：官方 React 动态高度实例，实施时按锁定版本核对。
- https://www.w3.org/WAI/ARIA/apg/patterns/combobox/ ：焦点可保持在输入框，通过 activedescendant 管理选择。
- https://www.w3.org/TR/wai-aria/#aria-activedescendant ：活动条目应可见，引用节点必须实际存在。

未发现可调用 Context7 工具，使用官方文档替代。已安装 @tanstack/react-virtual 3.14.13（virtual-core 3.17.11），peerDependencies 明确包含 React 19。overscan=5 已通过 1000 条混合高度浏览器验证；细节见 verification.md。
