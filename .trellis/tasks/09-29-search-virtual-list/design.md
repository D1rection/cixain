# 设计方案

## 布局与组件
保留 SearchOverlay，输入框和关闭按钮固定在上方，其下增加紧凑总数行，结果区是唯一列表滚动容器。ready 且查询非空时展示“共 N 条结果”；零结果保留空态。删除更多按钮，不模拟加载或追加批次。

SearchOverlay 保留索引状态、查询、完整 results、activeIndex、IME、焦点锁定和导航。新增 SearchResultsList.jsx 与同名 CSS Module 管理虚拟化。契约为 results、activeIndex、onActiveIndexChange、resultHref、onResultClick、navigationRequest。高亮继续使用 highlightRanges；搜索排序与 URL 不变。

navigationRequest 包含全局目标索引与递增序号，只由方向键生成。hover 仅更新选择，不触发主动滚动，避免鼠标滚动时被拉回。修改 query 重建结果列表会话，重置滚动和高度缓存；索引替换也需清空旧测量。关闭时卸载列表并释放观察器。

## 虚拟化和测量
选择 @tanstack/react-virtual v3 系列，实施时核对实际版本与 React 19 peer 兼容并锁定 lockfile。该库不提供预制视觉样式，适合现有 CSS Modules。Context7 当前不可调用，依据官方 API 与动态高度示例设计，实施时按锁定版本再次核对。

useVirtualizer 使用完整 count、实际结果滚动容器和稳定 item.id；保守估计行高，初始 overscan=5（上下各五条，实测可调）。以 measureElement 和 data-index 测量真实高度，内部占位容器承载总高度，条目按虚拟位置绝对定位。容器 min-height:0、overflow-y:auto，头部不收缩；少量结果不撑成空白长列表。

rangeExtractor 将正常可见范围与 activeIndex 取并集，最多多保留一条，保证 activedescendant 引用不失效。DOM 按全局索引排序，不使用虚拟数组的局部位置作为选择索引。

观察器测量已挂载行；宽度或字体变化时同时使离屏旧测量失效。记录顶部可见 item.id 与条目内偏移，重测后尽量恢复阅读锚点。仅尺寸真实变化才清缓存，避免观察器循环。键盘滚动采用即时定位，目标测量落定后必要时校正可见性，不用平滑动画或无限纠偏。

## 键盘与无障碍
保留 input combobox 和 listbox/option，键盘焦点留在输入框。方向键对完整 results 钳制边界，不循环；Enter 打开当前目标。IME 期间不执行选择，Home/End 保持原生光标语义。

结果保持 a[href]，设置 tabIndex=-1，保留中键、修饰键、上下文菜单。弹层 Tab 环查询需排除这些链接，包含输入框、关闭、错误重试等控件。普通点击沿用关闭弹层和原生导航。

每条 aria-posinset=index+1、aria-setsize=results.length、aria-selected；DOM ID 由组件实例前缀和安全编码的稳定结果 ID 组成。无结果时移除活动引用。总数使用 polite 状态播报，滚动不重复播报。不能仅凭属性存在宣称读屏通过。

## 性能、兼容与回滚
仅解决渲染节点成本；全量索引下载、Fuse 建索引与同步搜索计算保留，性能记录区分搜索和列表渲染耗时。记录 JS 构建体积增量，本次不扩展为全站分包改造。

弹层初始关闭，服务端不访问 DOM；列表实际展示时才挂载。验证手机软键盘下输入框、关闭按钮和列表可用。

回滚同时撤销列表组件、父组件接线、样式、依赖和 lockfile，索引协议无需回滚。不可仅撤掉依赖而保留绝对定位布局。
