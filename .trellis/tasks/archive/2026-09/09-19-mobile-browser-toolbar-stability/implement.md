# 实施计划（待设计审阅后执行）

## 0. 开始条件
- [x] 用户审阅 PRD、design.md 后确认进入实现，已执行 task.py start。
- [x] 读取 frontend index、component-guidelines、hook-guidelines、quality-guidelines、ssg-pipeline。
- [x] 记录工作区既有修改。当前已有 .obsidian、Templates/new-post.md、public/feed.xml、public/sitemap.xml 和 public/og 的修改／未跟踪产物；未覆盖、清理或纳入本任务提交。

## 1. 最小结构验证
- [x] 在 App 添加包含 NavBar + Layout + Footer 的容器，浮层留外部；新增 CSS Module。
- [x] 仅移动端限制 html/body/#root 宽高和 overflow；覆盖现有 min-height:100vh；设置容器 overflow-y:auto 和 overscroll-behavior-y:contain。
- [x] 用响应式浏览器验证长文章、菜单和 Footer 的容器滚动；Android Chrome 真机仍待验证。
- [ ] Android Chrome 真机记录 OS/浏览器版本、地址栏位置；检查工具栏展开时连续滑动、惯性、到顶到底的行为。没有设备访问条件则留下待验记录，不伪造通过。
- [ ] 核心行为通过再继续完整迁移；失败则回设计排查，不扩大到事件拦截方案。

## 2. 滚动功能迁移
- [x] 实现共享滚动目标、指标、订阅、回顶以及断点切换处理。
- [x] 迁移进度、回顶、路由回顶、目录高亮；尺寸和内容高度变化后同步进度。
- [ ] 核查直接文章 URL、目录、hash 跨文、SPA 切换、前进后退和懒加载。
- [x] 搜索／图片预览接入统一背景锁，支持交叠状态和路由离开清理；已验证搜索浮层打开／关闭时容器锁定与恢复。
- [x] 加入打印解除约束规则，检查 SSG 首帧和水合一致。

## 3. 验证矩阵
| 场景 | 必查结果 |
|---|---|
| Android Chrome 真机，长文章 | 浏览器工具栏保持展开；正文可滚至末尾 |
| 顶部／底部继续拖动 | 不把滚动交给页面，不触发工具栏动画；记录下拉刷新变化 |
| 短页面／首页／归档／索引／筛选 | 高度正确，导航与 Footer 正常，无双滚动 |
| 阅读进度／回顶／目录 | 数据随容器更新，目录定位不被站点导航遮挡 |
| 直达及 SPA hash 链接 | 正确定位，图片加载后不明显错位 |
| 搜索／图片预览／返回 | 背景锁正常，关闭恢复位置，键盘不遮挡主要操作 |
| 旋转及跨 768px | 新旧滚动源切换正确，不累积监听 |
| 桌面 Chrome | 继续 window 滚动，菜单与固定目录正常 |
| SSG 预览／刷新／打印 | 无水合异常，首屏可用，长文打印完整 |

现有 package.json 没有 lint/typecheck/test 脚本，不编造检查结果。开发验证使用现有 npm run dev；完整验证使用 npm run build 后 npm run preview。build 会写 public/feed.xml、public/sitemap.xml 和 public/og 等文件：优先在隔离副本/工作树运行生产构建，或准确备份恢复本次产生的差异，不能用 git restore 覆盖用户原有更改。
可为共享滚动源切换与锁重叠写少量有价值的行为测试（若现有环境可执行），不为本任务搭建大型测试框架。桌面自动化结果不能替代 Android 真机工具栏验收。

## 4. 完成与回滚
- [x] 将测试设备/版本、步骤、证据和未覆盖项写入 research/validation.md。
- [x] 评估并更新组件规范中的滚动目标、锁定和移动端容器约定，只记录已验证的结构事实。
- [x] 检查最终 diff 仅含本任务内容，无用户现有文件改动被误处理。
- [ ] 若真机失败则整组回滚布局及滚动访问迁移，保持任务未完成。
- [ ] 实现和验证结束后按 Trellis 流程处理提交与收尾。本次设计轮不实施、不提交、不归档。
