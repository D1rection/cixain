# 块级引用（Obsidian `^id` 锚点跳转）

## Goal

让博客内容可以引用「另一篇文章的某一处内容」：来源处写作 Obsidian 原生块引用语法 `[[文章名#^块id]]`，渲染为可点击链接；点击后跳转到目标文章的指定块（段落 / 标题 / 列表项 / 代码块 / 公式块 / 引用与 callout），并平滑定位 + 目标块高亮反馈。

## Scope

- 改 `scripts/build-posts.js`：修复现挂未生效的 `remark-obsidian-link` 插件签名；新增 `^id` → 元素 id 的注入插件；构建期失效引用校验；无 alias 时渲染目标文章标题。
- 改前端：文章页内容渲染完成后定位 `location.hash` 对应块（含懒加载图片落定处理），平滑滚动 + 目标块高亮渐隐；`PostContent`/`global.css` 增补 `:target` 样式。
- 附带复活 `[[slug]]` 普通互链（同一插件修复的自然结果）。
- 不动：列表 / 卡片 / 侧栏 / TOC / 主题变量 / 路由结构 / posts.json 字段。

## Requirements

1. **语法**：只认 `[[文章名#^块id]]`（可带 `|别名`）。渲染为 `<a href="/blog/<slug>#<id>">`，href 中 `^` 前缀去除。
2. **锚点源**：目标 md 文件中 Obsidian "Copy link to block" 写入的 `^块id` 行标记；构建器将该标记转为前一块的元素 `id`（Obsidian 语义：`^id` 属于其上方最近的块）。
3. **可挂载类型**：段落、标题、列表项、代码块、公式块、引用 / callout（统一规则，无需豁免清单）。
4. **无 alias 显示**：目标文章标题（构建期读目标 md frontmatter `title`）；有 alias 显示 alias。
5. **落地体验**：跳转后等内容渲染与懒加载图片落定，平滑滚动到目标块（沿用 `scroll-margin-top: 60px` 偏移），目标块短暂高亮渐隐。
6. **失效校验**：构建期扫描全部引用 `[[slug#^id]]` —— 目标文章存在、`^id` 存在、同页 id 无重复；不满足则 `console.warn` 并在构建末尾汇总「N 条失效引用」，不阻断构建。
7. **同文自引用** `[[当前文章#^块id]]` 免费支持（同一代码路径）。

## Constraints

- 复用既有构件：`useHeadingAnchors` 的 slug 体系不动；滚动定位与现有 TOC 滚动逻辑同风格；样式走现有 CSS Modules / 主题变量。
- 不引入新依赖；无运行时 fetch（目标标题在构建期解析）。
- 存量正文无 `[[` 内容（已 grep 确认），插件修复零回归风险；样式不动列表 / 卡片 / 侧栏。
- 亮 / 暗主题皆需验证；高亮不得破坏 callout / blockquote 既有背景效果。

## Acceptance Criteria

- [ ] `[[目标文章#^demo]]`（目标段带 `^demo`）构建后：链接 `href=/blog/目标文章#demo`、无 alias 时文本为目标文章标题、带 alias 时文本为 alias。
- [ ] 直达 `/blog/目标文章#demo` 与站内点击：内容渲染 + 懒加载落定后平滑定位到该段，目标块高亮渐隐。
- [ ] 段 / 标题 / 代码块 / 公式块 / 列表项各抽 1 例构造验证，均可跳转定位。
- [ ] 失效引用（目标文章不存在 / 无该 `^id` / 同页 id 重复）构建打印警告并汇总条数，构建成功。
- [ ] `[[slug]]` 普通互链恢复可用；存量页面零回归；列表 / 卡片 / 侧栏样式不变。
- [ ] 亮 / 暗主题、桌面 / 移动端无样式冲突；`npm run build` 通过。

## Notes

- 轻量任务：单 build 插件 + 前端定位逻辑；产出 `design.md` + `implement.md`。
- 调研与可行性依据：`research/block-ref-research.md`（含 obsidian-link 0.2.4 签名契约实测）。
- 明确不做（二期候选）：悬停引用预览（hover tooltip）、`[[文章名#标题文本]]` 按标题名称匹配、代码行级锚点。
- 前置事实：`remark-obsidian-link@0.2.4` 的 `toLink` 契约为 `(wikiLink) => ({ value, uri })`，项目现有 `(slug, text) => ({ href, children })` 与之不符，`[[...]]` 从未生效；`remark-wiki-link` 原生解析 `#` 片段为 `value = "slug#^id"`（实测通过）。