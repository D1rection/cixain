# Journal - cicada (Part 1)

> AI development session journal
> Started: 2026-06-24

---



## Session 1: 图片懒加载

**Date**: 2026-08-14
**Task**: 图片懒加载
**Branch**: `main`

### Summary

vanilla-lazyload data-src 懒加载 + 终端风双主题占位图 + 构建期尺寸解析零 CLS + 淡入/错误态；修复 React 19 dangerouslySetInnerHTML 重渲染重置图片 bug；spec 更新

### Main Changes

- Added `content/fragment/` as an independent content type with direct SSG pages, cross-type links, block references, backlinks, sitemap entries, and no navigation/list page.
- Reworked search to index complete visible Markdown by section, rank exact matches before limited fuzzy suggestions, show snippets/highlights, and link to matching headings. Search UI uses generic wording and hides content type labels.
- Preserved the user's pre-existing Obsidian and generated-file modifications; only the feature files were committed.

### Git Commits

| Hash | Message |
|------|---------|
| `832ea93` | (see git log) |

### Testing

- [OK] `npm run build` passed in an isolated worktree; the build used 22 existing posts and no fragment Markdown.
- [OK] Changed JS/JSX syntax parsing, Trellis task-context validation, and `git diff --check` passed.
- [Not run] Automated search tests, browser checks, and performance measurements.

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 2: 博客排版呼吸感优化

**Date**: 2026-08-19
**Task**: 博客排版呼吸感优化
**Branch**: `main`

### Summary

调研基准排版参数（中文排版规范/垂直节奏/行宽），重构正文垂直节奏为 28px 栅格+主题排版变量+暗色补偿，双主题双端验收，spec 新增 typography.md

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `e0f3e9f` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 3: 引用块旁注风与公式行呼吸

**Date**: 2026-08-19
**Task**: 引用块旁注风与公式行呼吸
**Branch**: `main`

### Summary

引用块改旁注风（竖线+双主题半透明叠层+右圆角+正文色），实测修复 \boxed 相邻行重叠（-3px→0，:has(.katex) 公式段行高 2.1），spec 补引用块约定

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `f50109e` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 4: 文章页头部meta展示

**Date**: 2026-08-19
**Task**: 文章页头部meta展示
**Branch**: `main`

### Summary

头部 meta 行新增 git 注入的更新时间与镂空圆角标签 chip；内联样式迁 CSS Module；spec 补 updated 注入约定

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `a2fafe1` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 5: 侧栏系列区块与标签样式对齐

**Date**: 2026-08-19
**Task**: 侧栏系列区块与标签样式对齐
**Branch**: `main`

### Summary

桌面侧栏新增系列区块（动态提取、最新文章日期降序、篇数、链接既有系列页）；文章页头部 tag 对齐侧栏样式（4px 圆角细边框 muted）

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `74d6187` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 6: 块级引用（Obsidian ^id 锚点跳转）

**Date**: 2026-08-20
**Task**: 块级引用（Obsidian ^id 锚点跳转）
**Branch**: `main`

### Summary

跨文章引用指定块：[[文章#^id]] → /blog/文章#id；rehype链末端挂id（shiki/katex后防丢失+嵌套root摊平）；失效引用构建期警告；useHashScroll居中滚动+outline高亮；目录双id修复；模板加提示

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `44d5d16` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 7: 图片显式尺寸

**Date**: 2026-08-20
**Task**: 图片显式尺寸
**Branch**: `main`

### Summary

删除构建期图片尺寸解析（网络请求）；remarkImagePipe 扩展显式宽高语法（![|pos w h]，分隔符空格/x/×，高可选→4:3预设盒）；存量22图回填真实高度保持零CLS；构建恢复秒级零网络；spec/模板更新

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `3db7a2d` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 8: 导航栏两端留白修复

**Date**: 2026-08-21
**Task**: 导航栏两端留白修复
**Branch**: `main`

### Summary

NavBar 去掉 max-width:1200 居中约束,内容铺满全宽,桌面端两端留白 32px(移动 16px);按 Material 规范取值;归档 task 08-21-navbar-edge-gap

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `7d5eae53c97168bcc6ea42a04c71070ca17a8062` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 9: 文章更新时间迁移到 frontmatter

**Date**: 2026-08-27
**Task**: 文章更新时间迁移到 frontmatter
**Branch**: `main`

### Summary

updated 改为 frontmatter 来源（Obsidian update-time-on-edit 插件写入）；修复 CI 浅克隆导致所有文章更新日期全部刷新的问题；删除 gitCommitDate 依赖，13 篇存量文章回填 git 历史日期；插件配置已修正为 YYYY-MM-DD 纯日期格式并重新启用

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `27a2c32` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 10: Soln 题解分类

**Date**: 2026-08-27
**Task**: Soln 题解分类
**Branch**: `main`

### Summary

新增题解分类 Soln：首页隐藏、仅分类页进入；侧边栏去全部入口；feed 排除、sitemap 保留；发布 LC231；去掉硬编码分类列表

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `fd66d00` | (see git log) |
| `7cc2456` | (see git log) |
| `b684c41` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 11: 移动端内容浏览入口实现

**Date**: 2026-09-05
**Task**: 移动端内容浏览入口实现
**Branch**: `main`

### Summary

完成移动端固定六入口导航与 /browse 内容索引页，抽取共享 taxonomy 统计，接入静态渲染与 SEO，并完成构建和路由校验。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `31574b5` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 12: 文章索引视觉与图标菜单优化

**Date**: 2026-09-05
**Task**: 文章索引视觉与图标菜单优化
**Branch**: `main`

### Summary

将 /browse 页面统一命名为文章索引，采用柔和圆角、系列路径与胶囊标签视觉；移动端六入口改为纯图标并补充可访问名称，完成生产构建与静态输出检查。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `c266fc9` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 13: 文章索引排版式重设计

**Date**: 2026-09-05
**Task**: 文章索引排版式重设计
**Branch**: `main`

### Summary

以归档页为视觉基准重做文章索引：统一字号、内容宽度和留白，使用无卡片的分类、系列与标签文字目录；验证浅深主题、六图标移动菜单及生产构建。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `c92bd8d` | (see git log) |
| `39f7c5c` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 14: 文章属性控制首页可见性

**Date**: 2026-09-17
**Task**: 文章属性控制首页可见性
**Branch**: `main`

### Summary

新增 showOnHome 文章属性控制首页显示，题解历史文章迁移为隐藏；RSS 改为独立分类配置。已完成静态构建、SSR、RSS、sitemap 和非法属性校验，并归档 Trellis 任务。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `7376ef8` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 15: 移动端独立滚动容器与 Android Chrome 工具栏稳定性

**Date**: 2026-09-19
**Task**: 移动端独立滚动容器与 Android Chrome 工具栏稳定性
**Branch**: `main`

### Summary

实现移动端 html/body/#root 视口锁定和独立滚动容器，迁移进度、回顶、目录及浮层锁定逻辑；完成构建与响应式浏览器验证，Android Chrome 真机工具栏行为待部署后验证。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `61234e8` | (see git log) |
| `2867641` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 16: Navbar 脱离滚动容器

**Date**: 2026-09-19
**Task**: Navbar 脱离滚动容器
**Branch**: `main`

### Summary

将 Navbar 移到 ScrollContainer 外，避免经典滚动条占位造成右侧背景空隙；移动端继续由独立容器滚动。已通过 npm run build、git diff --check 与 Trellis 校验。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `219244a` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 17: 完成文章版本对比质量修复

**Date**: 2026-09-22
**Task**: 完成文章版本对比质量修复
**Branch**: `main`

### Summary

重写文章历史版本结构对齐与富文本差异渲染，增加变更区域导航、schema 2 历史资源契约和回归测试；完成构建、浏览器验收，并提交推送至 main。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `08def39` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 18: 统一明暗主题正文排版

**Date**: 2026-09-27
**Task**: 统一明暗主题正文排版
**Branch**: `main`

### Summary

统一 light/dark 正文与引用排版参数，完成浏览器几何核对与 Vite 生产构建，并归档 Trellis 任务。

### Main Changes

- 实现提交：`c6029c3`（fix(typography): 统一明暗主题正文排版）。
- 归档提交：`1c27b03`（chore(task): archive 09-27-theme-typography-stability）。
- `git diff --check` 通过，独立临时副本 Vite 生产构建成功；浏览器两主题尺寸与滚动位置核对一致，细节见归档任务的 `research/validation.md`。
- 未覆盖工作区既有的 Obsidian 配置、文章索引、模板、构建脚本和生成资源改动。


### Git Commits

| Hash | Message |
|------|---------|
| `c6029c3` | (see git log) |
| `1c27b03` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 19: 文章总览 Callout

**Date**: 2026-09-28
**Task**: 文章总览 Callout
**Branch**: `main`

### Summary

实现并提交 [!overview] 总览 callout，增加模板示例、route 图标、浅深主题横幅样式和内容管线规范；同时单独提交 Markdown 零宽空格清理。compileMD smoke check、Vite build、Trellis 校验通过；未运行完整内容构建，以保护工作区原有生成文件修改。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `1b5762c` | (see git log) |
| `7563902` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 20: Fragment 内容与全文搜索

**Date**: 2026-09-28
**Task**: Fragment 内容与全文搜索
**Branch**: `main`

### Summary

新增无导航的 fragment 知识页面、跨类型引用和反向链接；改进全站全文搜索。完成生产构建与源码解析校验，归档两个 Trellis 任务并保留工作区原有个人修改。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `62eb60f` | (see git log) |
| `6b9f430` | (see git log) |
| `9c732a3` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 21: 碎片模板日期字段规范

**Date**: 2026-09-28
**Task**: 碎片模板日期字段规范
**Branch**: `main`

### Summary

规范 fragment 模板中首次公开日期与实质更新时间的语义；同步内容管线规范，验证 frontmatter 与现有回归测试，通过后归档 Trellis 任务。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `e03cc64` | (see git log) |
| `85a7e11` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 22: 总览开放式导语视觉调整

**Date**: 2026-09-29
**Task**: 总览开放式导语视觉调整
**Branch**: `main`

### Summary

按用户反馈将 overview 改为透明无框无分隔线的开放式导语，标题、route 图标及内容统一 15px，内容使用柔和主题文字色，保留段落节奏。同步规范与设计文档；用户确认效果并授权提交归档推送。未运行测试或构建，保留无关修改。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `e0577d9` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 23: 搜索结果动态高度虚拟列表

**Date**: 2026-09-29
**Task**: 搜索结果动态高度虚拟列表
**Branch**: `main`

### Summary

使用 TanStack Virtual 替换搜索分批显示，支持动态高度、全量键盘导航、稳定阅读锚点与 ARIA 活动项。千条混合高度及 320/390px 窄屏自动化检查、生产构建、9 项 revisions 测试通过；gzip 增加 8.45 KB。设备级未测项已记录，用户授权归档提交推送，其他工作区修改排除。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `a273386` | (see git log) |
| `4b11164` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 24: 分类和系列按文章数排序

**Date**: 2026-09-29
**Task**: 分类和系列按文章数排序
**Branch**: `main`

### Summary

文章索引的分类和系列按文章数量降序排列；分类并列保留配置顺序，系列并列按最近日期和名称排序。完成代码提交并归档 Trellis 任务。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `1292c4a` | (see git log) |
| `5797df1` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 25: 完善碎片发布与链接可靠性

**Date**: 2026-09-29
**Task**: 完善碎片发布与链接可靠性
**Branch**: `main`

### Summary

统一文章与碎片双链解析及搜索标题，模板默认草稿，生产检查失效引用与日期，补充碎片正文加载/重试/取消和中文锚点定位。7 项内容测试与9 项 revisions 测试通过；隔离生产构建、草稿残留隔离及根路径/子路径浏览器检查通过。修正一处历史标题链接；其他工作区修改排除。用户已授权归档提交推送。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `3ef6fc8` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 26: 桌面与移动端统一正文独立滚动

**Date**: 2026-09-30
**Task**: 桌面与移动端统一正文独立滚动
**Branch**: `main`

### Summary

统一正文滚动容器与 Navbar 边界，调整目录留白和键盘访问；构建及7项内容测试通过，Chrome验证包含经典滚动条与嵌套浮层。已归档，用户原有修改未纳入提交。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `e24551f` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete
