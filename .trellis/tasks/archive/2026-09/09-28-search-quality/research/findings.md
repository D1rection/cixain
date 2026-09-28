# 搜索调查（2026-09-28）

## 已确认代码问题
scripts/build-search-index.js 只读 posts，去 HTML 使用正则，text.slice(0,2000) 丢弃后半文；没有 tags、kind、统一 URL、锚点或 schema。HTML 文本可能混入复制按钮和 KaTeX 多份表达。
SearchOverlay.jsx 对 title/description/text 使用同权 Fuse，threshold=0.4，未配置 ignoreLocation；每次打开重新 fetch；catch 为空，加载与错误被误显示“无匹配结果”；只显示前 10 条，无上下文、命中高亮、更多结果或方向键选择；只处理 Escape，无 dialog/focus trap/焦点恢复；导航固定 /blog/。

## 本地可重复验证
读取现有 public/search-index.json（未重建，属于已有快照）：22 项，71023 bytes，19 项 text.length===2000。这证明现有快照大量触及截断上限，不代表刚重新核验了所有已发布源文件。
在已安装 Fuse 运行合成样本 text='甲'.repeat(150)+'唯一检索标记'，title='测试'，沿用当前 keys 和 threshold：search('唯一检索标记') 返回 []；只加 ignoreLocation:true 返回 1 项。代码 node_modules/fuse.js/dist/fuse.mjs 明确默认 location=0、distance=100、ignoreLocation=false。仅取消 2000 字符截断仍不足以解决正文召回。

## 方案权衡
只调 Fuse 参数成本最低，但仍欠缺全文/段落上下文/可靠精确优先规则；当前内容量适合完整分段文本+明确精确匹配，Fuse 限定用于模糊补充。新增服务和向量检索超出当前需要。新算法性能尚未实测，必须按 implement.md 固定语料评估。
当前 build-seo.js 含主动搜索引擎推送副作用；后续验证构建应拆离或关闭，避免测试意外发布 URL。

## 文档查询限制
工具清单无 Context7；尝试访问官方 https://www.fusejs.io/api/options.html 与 /api/options 未成功，因此库默认值结论以已安装代码及本地复现为依据，不声称已验证最新线上 API。实施若修改第三方 API，应再查询可用官方文档。

## 顺序
任务 1 先统一 id/kind/url、已发布集合、稳定锚点及最小搜索接入；本任务随后升级索引 schema 和检索体验。重新确认任务 1 最终实现后再 start。
