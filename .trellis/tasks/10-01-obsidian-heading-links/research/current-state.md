# 调查记录（2026-10-01）

## 证据与根因

仓库现状：src/utils/contentLinks.js 的 parseWikiTarget 对 hash 解码后原样返回；build-posts.makeToLink 直接编码此 anchor；rehypeHeadingAnchors 另外调用 slugifyHeading 生成 ID；content-validation 只检查 anchor 是否属于目标实际 ID 集合。因此渲染与校验同时缺少“源标题 → 实际 ID”解析。

用户真实标题在对应文章中存在：2026-08-21-001.md:141 的 `3.3 Softmax 回归`，2026-08-12-001.md:27 的 `1. 梯度下降法`。内存 compileMD 核对实际 ID 分别为 `33-softmax-回归`、`1-梯度下降法`；没有修改用户正文。

| 内存夹具 | 当前标题 ID | 当前 wiki hash 解码值 |
| --- | --- | --- |
| `## 3.3 Softmax 回归` | `33-softmax-回归` | `3.3 Softmax 回归` |
| `## A.B` 后接 `## AB` | `ab`、`ab-1` | `A.B`、`AB` |
| `## 标题 ^fixed` | `fixed` | 标题链接为 `标题`；块链接为 `fixed` |
| `## **Softmax** 与 $x$` | `softmax-与-xxx` | `Softmax 与 x` |

最后一例源于 collectText 遍历完整 KaTeX 子树。不能靠对链接文本 slugify 修复，也不能从最终富文本 HTML 反推作者标题。既有公式 ID 行为应保持，新增源标题到其实际 ID 的映射。

现有 `npm run test:content` 7 项全部通过（本会话调查阶段已运行）；同文标题测试使用 `标题`，其文字与 ID 相同，未覆盖转换后不同的情形。这是测试缺口，不是现有测试失败。本轮设计未运行部署或全站构建。

## 插件与数据保留

本地 package.json：unified ^11.0.5、remark-rehype ^11.1.2、remark-obsidian-link ^0.2.4。实际调用契约由 node_modules/remark-obsidian-link/lib/index.ts 核对：toLink 返回 value/uri/title；插件用 mdast-builder 创建全新节点并替换 parent.children[index]，没有继承 position/data。

mdast-util-to-hast/lib/state.js 的 applyData 支持 data.hProperties，patch 继承 position。设计中的桥接需要补回 wiki 生成节点的关联及位置，不能假设 toLink 能保留额外属性。当前 collectWikiRefs 已在替换前保存源位置，但最终 HAST 不知道哪些 a 来自 wiki；现有收集只靠 href 与 refs 的值比较去重。

buildPosts 已在写出前缓存 outputs 并完成生产门禁，可以沿用这条边界；修改需要把标题和链接解析也放到此边界之前。仅预扫 registry 标题不足以解析章节，且不能读上次生成 HTML 作为本次权威数据。

## 其他消费者

- build-history.buildComparison 直接调用 compileMD；历史 registry 只有文件元数据，没有章节索引。构建通过多个独立 Node 进程运行，因此需显式的构建中间索引或更大的入口重构。推荐小型生成索引。
- BlogPost.addComparisonHeadingIds 会将比较正文标题 ID 替换为 revision-heading-*，历史 wiki 的局部标题 hash 不能依赖这些元素。推荐历史 wiki 导向当前正文，避免扩展整个历史阅读器。
- build-search-index 使用编译 HTML 的 heading ID，wiki 只用于文本显示。useHeadingAnchors 复用已有 ID，useHashScroll 在正文就绪后解码一次并定位。没有必要引入客户端标题解析。
- content/registry.json、正文 HTML、public/history 等为现有忽略的生成文件。新增 anchor-index.json 应同样忽略，不混入作者内容或页面数据。

## 官方资料

[Obsidian Internal links](https://obsidian.md/help/links) 明确支持 `[[#标题]]` 和 `[[文件#标题]]`，也分别描述块引用及别名。因此支持作者的原始标题写法有直接依据。文档另有多级标题路径，本任务限定单个章节名，不能宣称完整兼容所有 Obsidian 链接。

[unified 官方仓库](https://github.com/unifiedjs/unified#overview) 分别提供 parse/run/stringify，允许转换完成后延迟序列化；process 是三阶段合并入口。拆分时保留 VFile，防止自定义 interactive 插件依赖的 file.data 或源码丢失。以本地安装版本和现有调用核对，不升级依赖。

本会话工具未提供 Context7；本次设计使用上述官方资料及已安装源码交叉核对。平台未暴露项目 trellis-brainstorm 技能，搜索项目与用户技能目录也未找到；直接按 .trellis/workflow.md 的 Phase 1 完成需求、研究、设计及执行计划，不自行安装或改变工作流。

## 相关规范

.trellis/spec/frontend/index.md、content-validation.md、content-pipeline.md、quality-guidelines.md。content-validation 的“不按标题猜测”针对文件寻址；本任务不改变文件名选择，只增加选定文档内部的章节标题解析，实施时应澄清这一区别。

## 待审决策

完全同名标题取首个；标题与旧 ID 指向不同元素时报歧义；富文本/公式标题通过源语义匹配，不改变旧 ID；历史 wiki 跳到当前正文；生成索引只供构建进程共享。以上为项目设计选择，未将未验证的细节当成 Obsidian 官方行为。
