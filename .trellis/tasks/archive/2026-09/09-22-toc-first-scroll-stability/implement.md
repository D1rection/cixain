# 实施与验证计划

状态：implementation complete；已完成验证，随本次提交归档。

## 顺序

- [x] 进入实施时读取 Trellis before-dev/check 及 frontend component、hook、content-pipeline、quality 规范。
- [x] 新增 hook：单目标坐标、末尾钳制、初次动画完成判定、事件合并、时限和取消。
- [x] 接入 TableOfContents，保留 60px 留白、高亮和 hash 行为。
- [x] 在当前源代码的 dev / 新构建环境复测，不能只用可能过时的现有 dist。
- [x] 记录下列矩阵的真实坐标、加载状态、取消后无继续滚动的证据。
- [x] 更新组件规范中的导航稳定性约定，完成构建与回归并审阅 diff。

## 已完成验证

- Chromium 桌面 1440px：首次点击后在图片加载造成正文高度变化的情况下，标题最终误差约 0.17px；快速 A/B 点击只保留最后一个目标。
- Chromium 移动容器 601×837：首次点击第二节最终误差约 0.04px；前置图片由占位高度切换到真实高度后仍保持标题落点。
- 手动滚动取消：用户滚动后不再被导航会话拉回。
- `node --check src/hooks/useTocScroll.js`、`npm run test:revisions`、`npm run build`、`git diff --check` 已通过。
- 未覆盖项：390px、WebKit/Safari、超时/错误图片和完整路由切换矩阵尚未在本轮浏览器中逐项量化；实现包含对应的取消与超时分支。

## 验证矩阵

| 场景 | 验收 |
| --- | --- |
| ZT1 第二节，390/601/1440px，SSG/SPA | 首次与再次差 ≤2px；window 和容器均验证 |
| 无图、缓存、多图延迟 0.2/0.8/2s | 立即响应，窗口内加载落定后准确 |
| 错误占位二次加载、超过 3s 才响应 | 不挂起，到期停止追踪 |
| 快速 A/B、滚轮/触摸/键盘/滚动条 | 最新意图生效，旧图 load 不拉回 |
| 切路由、切比较版本、跨断点、卸载 | 旧请求不影响新内容，无资源残留 |
| 底部、已对齐重复点击、减少动态效果 | 不循环，不等待不存在的事件，不强制动画 |
| 块引用、差异导航、图片预览 | 既有语义正常，无导航竞争 |

优先真实浏览器 Chromium 和可用 Safari/WebKit，记录版本及未覆盖项。若自动化工具可用，保留少量有意义的延迟图片与取消竞态回归，不写镜像实现的测试。

检查命令：npm run test:revisions；npm run build；git diff --check。实现调用新增库 API 前按仓库规范查 Context7，工具不可用时记录一手文档替代。

## 工作区与回滚

已有 scripts/build-posts.js 零宽空格清理，以及 Obsidian、模板、feed/sitemap/OG 等用户变化，不属于本任务。构建前记录差异，不提交或清除原有改动。回滚限于新 hook 和 TOC 接入。若需要修改图片构建契约，应先更新设计，明确扩大范围。
