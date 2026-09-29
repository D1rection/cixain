# 仓库证据

- scripts/build-posts.js makeToLink：kind 初始为 options.kind，posts/ 与 post/ 分支仅剥前缀，没有重设 kind；实际 compileMD(...,{kind:'fragment'}) 验证 [[some-article]] 和 [[posts/some-article]] 均输出 /fragment/some-article/。
- scripts/build-search-index.js wikiLabel 默认 kind='post'，与正文冲突。
- buildPosts 已在生产过滤 draft 和未来 date，static-renderer 只复制当前发布清单正文；不是从零添加草稿能力。
- 现有引用检查已经提示不存在/未发布目标与缺失块，默认 warn；普通 Markdown 未注册目标不会收集，普通标题 hash 未检查。此前“没有草稿引用提示”的表述不准确。
- fragment 输出 date=data.date，updated=normalizeDate；缺少统一输入验证。模板无 draft 且指南在可渲染正文内。
- FragmentPage fetch 使用根路径，失败 setDevHtml('')；有 active 标志但无 AbortController，也无 loading/error/retry UI。
- 本次检查 content/fragment 中没有现成 wiki 链接匹配；实施前需重查实时用户内容，不能据此保证未来无迁移成本。
- 本任务仅做本地代码契约设计，未引入新第三方 API，不需要外部依赖选型。实施涉及库接口时按项目要求优先 Context7，不可用则查官方文档。

相关规范：.trellis/spec/frontend/{content-pipeline,component-guidelines,quality-guidelines,ssg-pipeline,hook-guidelines}.md；.trellis/spec/guides/index.md。
