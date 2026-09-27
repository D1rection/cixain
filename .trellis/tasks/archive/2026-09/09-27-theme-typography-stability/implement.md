# 实施与核对

## 状态

用户已授权实施；Trellis 当前任务已启动，状态为 `in_progress`。范围仅为共享正文排版 CSS、组件注释与活动 typography 规范。

## 执行记录

1. [x] 记录工作区原有改动；未覆盖或纳入本任务的 Obsidian 配置、内容模板、生成资源和 `scripts/build-posts.js`。
2. [x] 在原样式下测得 light/dark 长文总高度差 164.74px，详见 `research/validation.md`。
3. [x] 将四个正文/引用排版变量移入共享 `:root`，移除 dark 覆盖。
4. [x] 更新 PostContent 样式注释和活动 typography 规范，明确主题间共享排版参数。
5. [x] 浏览器核对桌面与移动长文中段、历史比较、关于页、公式引用、表格、折叠题干与代码块；未测试断点列于 `research/validation.md`。
6. [x] `git diff --check` 通过；独立临时副本的 Vite 生产构建成功；复核改动限定于上述三个实现文件和 Trellis 任务记录。

## 检查结果与边界

- 实际移动视口为 526×990，桌面为 1440×1000；375/768/769px 断点未逐一测量。
- about、普通长文及历史比较页的两主题几何测量相同。历史比较页通过临时复制到 fixture 的现有历史索引元数据启动，真实比较内容加载成功。
- 未新增或运行测试套件；CSS 构建与浏览器实测见 `research/validation.md`。
- 工作区有先前未提交的无关改动；提交时必须只纳入 `src/styles/global.css`、`src/components/PostContent.module.css`、`.trellis/spec/frontend/typography.md`，以及本 Trellis 任务文档。

## 后续

实现与验证记录已完成。用户已明确要求归档、提交并推送；本次提交仅包含实现 CSS、排版规范和 Trellis 任务记录，不纳入此前工作区中的无关改动。
