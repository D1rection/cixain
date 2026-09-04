# 文章索引排版式重设计 — 实施计划

## 1. Preparation

- [x] 读取 frontend component、typography、quality 与 SSG 规范。
- [x] 记录当前 Browse DOM、归档页字号/留白/列表基线、浅/深主题和 320/375/768px 基线。
- [x] 将 Steph Ango 参考页面的可借鉴原则写入 research，避免像素级复制。

## 2. Typographic Index

- [x] 精简页头，移除说明性文案、大标题和短路径标识，按归档页样式保留小号标题与中文文章数。
- [x] 统一三个区块的编号式标题与排版节奏。
- [x] 将分类改为无卡片文字入口。
- [x] 将系列改为贴近归档文章行的编号、名称、数量目录行。
- [x] 将标签改为无胶囊外框的文字主题云。
- [x] 复用归档页的 680px 内容宽度、四周留白、字号、细分隔线、4px 小圆角和 hover 反馈，再使用既有主题变量完成浅/深色适配。

## 3. Interaction and Responsive

- [x] 保持链接语义、44px 点击范围、focus-visible 与 active 状态。
- [x] 验证长系列名、标签换行以及 320/375/768px 无横向溢出。
- [x] 验证移动端六个纯图标菜单和桌面导航/侧栏无回归。

## 4. Validation

- [x] 运行生产构建和 `git diff --check`。
- [x] 检查 `/browse/` 静态 HTML、meta、canonical 与 sitemap。
- [x] 检查 taxonomy 数量、排序与目标链接未变化。
- [x] 完成浅色、深色、键盘与可访问性树回归。
