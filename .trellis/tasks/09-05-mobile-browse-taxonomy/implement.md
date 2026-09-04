# 移动端标签与系列浏览入口 — 实施计划

## 1. Preparation

- [x] 阅读 frontend component、SSG 和 content pipeline 规范。
- [x] 记录变更前移动端 320/375/768px 菜单入口数量、桌面侧栏顺序及当前 `/archive/`、标签、系列路由表现。
- [x] 确认工作区已有修改，所有实现仅触碰本任务文件及必要规范，不覆盖无关用户改动。

## 2. Shared Taxonomy Model

- [x] 新增纯函数统计模块，输出分类、系列和标签数据。
- [x] 保持现有排序：分类配置顺序、系列最近更新优先、标签热度降序和稳定名称次序。
- [x] 将 `Sidebar` 改为消费共享统计，先验证桌面输出无变化。
- [x] 为计数、稳定排序、空数组和缺失字段补充可执行测试；若项目没有测试框架，使用构建期 Node 校验脚本或最小断言。

## 3. Browse Page

- [x] 新增 `/browse/` 页面组件和模块样式。
- [x] 渲染分类、系列、标签三组及文章数，复用现有路由生成规则。
- [x] 实现 44px 触控目标、换行、长系列名和空态。
- [x] 设置页面标题。

## 4. Mobile Navigation

- [x] 新增移动端专用「浏览」入口与图标。
- [x] 仅在移动端隐藏 GitHub，桌面端保持现状。
- [x] 将移动端入口排列为固定 6 列，加入可见短标签并把主题文案调整为「外观」。
- [x] 补充 hamburger 的展开语义、Escape 关闭、路由变化关闭和当前页状态。
- [x] 确认背景按钮继续只在桌面显示，移动端总数严格为 6。

## 5. SSG and SEO

- [x] 在 `App.jsx` 注册 `/browse/`。
- [x] 在静态渲染器生成 `browse/index.html`，提供与首页同级的文章元数据。
- [x] 增加 browse 页 title、description、canonical 与 sitemap 条目。
- [x] 如存在 IndexNow/百度主动推送固定页面清单，同步纳入 `/browse/`。
- [x] 更新 frontend SSG/component 规范，记录新路由与移动端 6 入口约束。

## 6. Validation

- [x] 运行生产构建并确认所有静态页面生成成功。
- [x] 检查 `/browse/` HTML 内含预渲染分类、系列、标签和正确 meta/canonical。
- [x] 在 320px、375px、768px 验证菜单为 6 个入口、文字完整、无横向滚动。
- [x] 在 769px 与桌面宽度验证浏览入口隐藏、GitHub/背景仍存在、侧栏统计无变化。
- [x] 从首页、文章页、筛选页分别执行「菜单 → 浏览 → 分类/系列/标签」，验证导航、后退和菜单关闭。
- [x] 键盘验证 Tab、Enter、Space、Escape、focus-visible 和 `aria-expanded`。
- [x] 检查浅色/深色主题及 active/pressed 状态。

## 7. Review and Rollback Gate

- [x] 对照 PRD 验收全部条目，确认没有新增第 7 个移动端一级入口。
- [x] 检查 diff 不含内容文件、生成稿意外变化或无关工作区修改。
- [x] 若共享统计引起桌面回归，先回滚为内部兼容封装，不以复制第二份统计逻辑解决。
