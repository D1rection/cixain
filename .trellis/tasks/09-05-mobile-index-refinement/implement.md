# 移动端文章索引视觉与菜单调整 — 实施计划

## 1. Preparation

- [x] 阅读并确认 frontend component、typography、SSG 和 quality 规范。
- [x] 检查当前文章索引页与移动端菜单的基线 DOM、路由和主题变量。
- [x] 确认工作区已有修改，限定变更范围为本任务相关组件、文案和静态元数据。

## 2. Article Index Presentation

- [x] 将页面、document title、meta 与 accessible name 的「浏览」替换为「文章索引」。
- [x] 重做文章索引页 CSS：圆角卡片、系列路径列表、胶囊标签、留白分组和浅/深色适配。
- [x] 保持分类、系列、标签数据来源、计数、排序和现有路由不变。
- [x] 检查 320px、375px、768px 下长文本、标签换行和页面宽度。

## 3. Icon-only Mobile Navigation

- [x] 隐藏移动端六个入口的可见文字，保留图标、accessible name 和装饰性 SVG 标记。
- [x] 保持六列等宽、44px 以上触控区域、当前状态和菜单交互行为。
- [x] 验证桌面端 GitHub、背景、搜索、外观及侧栏无回归。

## 4. Static and Quality Checks

- [x] 运行生产构建，确认 `/browse/index.html`、meta、canonical、sitemap 输出正常。
- [x] 检查可访问性树：六个入口名称明确，文章索引下属路由 active 状态可感知。
- [x] 检查浅色/深色主题、focus-visible、hover/pressed 状态和 reduced-motion 兼容性。
- [x] 运行 `git diff --check`，确认不含文章内容、frontmatter 或无关工作区修改。

验证备注：自动化浏览器接口不支持强制指定视口，因此移动端尺寸由响应式断点、六列布局和最小触控尺寸做代码级核验；文章索引页已通过本地预览可访问性树检查。
