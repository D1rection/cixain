# 现状调查（2026-09-28）

证据为本仓库代码，未修改运行代码或重建站点。

- scripts/build-posts.js：只扫描 posts，makeToLink 所有链接硬编码 /blog/；titles 预扫含 draft；只收集块引用，普通双链不进入 refs。需要统一公开注册表和所有引用边。
- compileMD 被 scripts/build-history.js 复用。修改身份或参数会影响旧版本重建，必须兼容测试；历史编译不能进入最新反向链接。
- src/pages/BlogPost.jsx：meta 查找末尾回退到 post；原页面 Context 可能只有分类文章元数据，搜索 SPA 导航可缺数据甚至回退错文。新类型不能照搬。
- src/main.jsx / scripts/static-renderer.js：dev 只载 posts，SSG 按页注入；SSG 复制全部 posts HTML，不以发布集合过滤，重复构建残留是风险。
- src/hooks/useHeadingAnchors.js：标题 ID 由页面 hook 生成，跨类型引用和后续搜索需复用相同规则，保留显式块 ID。
- scripts/build-seo.js、generate-og.js、build-search-index.js 均围绕 posts；RSS 保持文章集合，sitemap 和搜索需显式增加 fragment。
- .gitignore 未包含 fragment 生成物，实施时补规则。
- 部分 spec 将路由写作 react-router，实际 src/App.jsx 用 wouter；以代码为准，实施时纠正相关过时说明。

工作流：codex 默认 inline。项目要求 trellis-brainstorm，但 .agents/skills、.codex 均不存在，用户技能目录亦未找到该文件；依据 workflow.md 的需求探索、研究落盘、三份规划文档要求直接完成本次设计，无需该技能才能分析本仓库。用户明确要两个任务，故保持两个顺序任务，不增加第三个父任务。两者维持 planning。

初始工作树有 Obsidian、模板、posts.json、feed/sitemap 和 OG 图片改动，均非本次修改，后续不得覆盖或纳入提交。
