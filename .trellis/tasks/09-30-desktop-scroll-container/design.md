# 技术设计

## 现状及决策
App.jsx 已将 NavBar 与 ScrollContainer 并列。差异集中在 global.css 的移动端根高度约束、ScrollContainer.module.css 的移动端 overflow 规则，以及 ScrollProvider 按 768px 选择容器或 window。采用全尺寸统一容器滚动，复用现有节点和 useScrollTarget 契约。

```text
html / body（视口尺寸，禁止主文档滚动）
└── #root（纵向 flex，固定高度）
    ├── Navbar（自然高度，不收缩）
    └── ScrollContainer（flex: 1; min-height: 0; overflow-y: auto）
        ├── Layout / 页面
        └── Footer
```

搜索、图片预览和回顶保持现有挂载关系。Navbar 不改成 fixed，不添加补偿占位；可保留现有 sticky 样式，其稳定位置由不滚动外壳保证。

## 布局边界
将 html/body/#root 的视口高度与 overflow 约束从移动媒体查询提取为全尺寸屏幕规则，沿用现有 height:100% 链条，确保 #root 的后置 min-height:100vh 不覆盖最终 min-height:0。移动壁纸规则继续留在移动查询中。

正文容器全尺寸启用 overflow-y:auto、min-height:0；横向溢出遵循现有移动方案，并检查桌面宽内容是否被错误裁切。Layout 与 Footer 保留自然内容高度，必要时只修正 flex 收缩边界。不得增加 transform/filter/contain 等会改变 fixed 后代定位参考的外壳属性。打印覆盖继续释放所有高度、overflow 和 flex 限制。

## 滚动上下文
ScrollProvider 不再依据 MOBILE_QUERY 选择主滚动目标：客户端容器挂载后统一返回 containerRef.current；挂载前/SSG 保持空目标，避免先订阅 window 又触发回顶。保留 target/getTarget/lock/unlock 接口和嵌套锁计数；删除仅服务断点切换的状态/监听，消费者中的兼容分支不为本任务大规模清理。

目标实例跨断点保持不变。滚动锁作用于正文容器，解锁还原此前 overflow；搜索及预览自己的局部滚动不受阻。原有锁迁移逻辑是否保留，按简化后的生命周期判断，不另造第二套锁。

## 目录与锚点
useTocScroll 已支持元素相对坐标和末尾钳制，可复用其稳定性校正与用户打断机制。当前 BlogPost.jsx 和 useHeadingAnchors.js 都注入 60px scroll-margin-top：桌面原来用于避开顶栏，迁移后会在正文顶部再次留出 60px。

拟使用统一 CSS 自定义属性表达标题留白：桌面正文内默认 8px，移动端保留既有 60px；生成标题的两条路径引用同一变量，不靠宽泛 !important 覆盖作者样式。8px 是保留原桌面 60px 减去名义 52px 导航高度后的设计默认值，浏览器验收时检查边框造成的实际几何差异。已有自定义标题 style 必须保留。

目录高亮以活动滚动区域顶部为基准检查，避免重复叠加导航高度；按实际滚动目标边界计算，不使用固定导航高度推测容器位置。宽屏目录仍为视口 fixed，保留 top:80px 及自身滚动，验证祖先 overflow 下的可见性。

useHashScroll 目前使用 scrollIntoView(block:center)，不是统一滚动目标 API。先验证它是否同时推动根外壳；若存在导航偏移或根滚动，则改成仅滚动活动目标并保留居中及短暂高亮语义，不扩大为整套锚点系统重写。

## 相关行为
阅读进度与回顶已订阅 target，优先直接复用。阅读进度当前 fixed top:0、z-index:9，导航 z-index:10；记录迁移前可见性基线，区分旧行为与新增回归，避免顺带视觉重设计。

图片懒加载保持现有实例配置，验证内部容器滚动能触发加载；仅在证实回归时调整。浏览器历史恢复与查找定位依赖真实浏览器验收：本任务不承诺新增“返回原阅读位置”功能，但必须保持既有导航语义，不能把未实测项标记为通过。

## 修改范围与约束
必改：src/styles/global.css、ScrollContainer.module.css、ScrollContainer.jsx。预计小范围关联：BlogPost.jsx、useHeadingAnchors.js、TableOfContents.jsx，以及定义标题间距变量的位置。其余滚动消费者、宽屏目录和 Navbar 样式仅在明确回归时调整。

更新 component-guidelines.md 中“桌面继续 window 滚动”及过时的回顶描述，在实现完成后同步；当前设计阶段不提前改规范。保留用户现有内容、Obsidian 和生成物修改。

## 回滚
布局 CSS 与滚动目标选择必须作为同一行为单元回滚，标题偏移与关联高亮调整同步撤回。不可只恢复 CSS 而继续向不滚动的容器发送滚动指令。无需数据迁移或功能开关。
