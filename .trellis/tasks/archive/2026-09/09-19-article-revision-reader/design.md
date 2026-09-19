# 文章版本阅读器设计

## 1. 方案

Git 提取历史 → 构建时预计算差异 → 浏览器按需加载展示。
客户端不解析 Markdown、不运行 diff，不打包 Shiki/KaTeX 编译器。
相较前轮口头方案，明确收敛为构建期计算；复杂内容首版完整块级替换。
构建和 UI 共用协议、必须联合验收，采用一个任务内分阶段实现。

## 2. 阅读体验

```text
文章标题
发布日期 · 更新日期 · 分类
标签
修订历史 · 3 个历史版本                              ⌄

点击后纵向展开：
          ● 当前版本
          │
          ○ 08-27 18:01 · a058a0d
          │
          ○ 08-27 17:20 · 182349b

选择后：
正在查看：2026-08-27 18:01 → 当前版本
删除内容 / 新增内容                 回到当前

正文原位显示单栏内联差异
```

修订历史默认收起，点击入口后用纵向时间线展开；版本节点使用原生 button，支持键盘和 aria-pressed。当前版本与历史版本用节点区分，不做大号表单控件。版本按主线新到旧。时间用 Asia/Shanghai 并标明北京时间，同分钟冲突用短哈希辅助。面向读者称已提交版本，不声称所有提交均上线。深链进入历史版本时自动展开。

unchanged 正常；inline 使用 ins/del；块级采用 section/div 加增删说明，避免非法标签嵌套。颜色、删除线、边框、文字共同表达，适配深浅主题。
状态 latest→loading→comparing；error 保留最新正文，支持重试/回到当前，aria-live 提示。
切换保留控件焦点；首版不折叠未改段落、不自动跳首个变更。
单版本隐藏控件；无效 compare 深链显示非阻塞提示。

## 3. 版本来源与一致性

固定 HEAD，沿 first-parent 主线遍历当前文章路径，读取合并后的正文，不能依赖可能漏 merge 的默认 path log。首版不追踪历史路径重命名：重命名后的文章从当前路径可读到的历史开始生成版本，旧路径追踪留作后续增强；复制视为新文章。

候选按各自 frontmatter 排除 draft:true；只为当前仍存在且生产可发布的 slug 输出历史。去 frontmatter，CRLF→LF，保留有语义空格和硬换行。
正文 SHA-256 合并相邻重复内容，保留该正文首次在主线出现的提交；A→B→A 保留回退，不全局去重。
元数据-only 不生成版本；链接目标、图片 URL、代码等语义变化保留。
默认保留所有符合条件版本，测量后再决定是否需要限制，不能静默截断。

工作区正文与 HEAD 一致时才绑定 Git baseline：
- 本地未提交/新文章可预览，但关闭其历史比较，不伪装成 HEAD。
- 严格 CI 出现正文/HEAD 不一致则失败。
- deploy 先 build 再 commit：本地构建允许上述降级，推送后的 CI 以新 commit 严格重建，不必改变发布提交顺序。
- Actions checkout 增加 fetch-depth: 0；无 Git/浅克隆在开发提示并禁用历史，严格 CI 失败。

## 4. 静态产物

```text
public/history/{slug}/{generation}/index.json
public/history/{slug}/{generation}/{fromCommit}.json
```

生成目录加入忽略规则；vite build 前生成，开发 Markdown 重建也更新。只清理本功能拥有的目录。
generation 包含 schemaVersion、compilerVersion、当前正文 hash、版本集合与输出摘要，历史变化时即便最新正文不变也会换代。

posts 元数据仅保存 revisionHistory 指针和轻量版本选项：
```js
{ schemaVersion: 1, generation, indexUrl, olderCount, currentBodyHash,
  revisions: [{ id, committedAt, subject, comparisonUrl }] }
```

文章页和列表页都只携带这个小索引，历史比较正文留在静态 JSON。SPA 进入文章时直接从已校验的版本指针解析比较 URL；默认阅读不加载比较正文。

index.json：
```js
{
  schemaVersion: 1, slug, generation,
  current: { id: fullCommit, bodyHash, committedAt },
  revisions: [{ id: fullCommit, committedAt, comparisonUrl }]
}
```

比较文件也携带 generation，客户端据此拒绝旧缓存或跨文章的比较正文。

比较文件：
```js
{
  schemaVersion: 1, slug, generation,
  from: { id, committedAt },
  to: { id, bodyHash, committedAt },
  html: "...",
  toc: [{ id, text, level }],
  changeCount: 4
}
```

展示前校验 schema/slug/generation/to.bodyHash。query 仅用于匹配文章元数据携带的轻量索引内已知 id，再读取其 URL，不能直接拼任意资源路径。缓存错配时保留最新并提示重试/刷新。

## 5. diff 与渲染

复用现有 compileMD 的插件顺序、titles、refs/defs 和 interactive 契约；导出编译函数但不触发全站写入。首版对已编译 HTML 做顶层块对齐和安全文本 diff，浏览器不解析 Markdown，也不携带编译器。

1. 以块标签、纯文本和局部顺序对齐相同块；小范围同类型正文变化做相似度配对，低可信配对输出整块删除/新增。
2. 普通段落、标题、简单列表项按词/标点和 grapheme 做文本 diff；英文按词，中文按 grapheme，避免拆 emoji。首版的 changed inline block 会以纯文本呈现，复杂内联语义以后再细化。
3. 固定构建 Node/ICU 环境确保分词可重现；算法/阈值计入 compilerVersion。
4. 不跨 HTML 标签包裹 ins/del；链接目标、强调、代码等结构发生变化时优先整块替换或保留未变块的安全 HTML。
5. 代码、表格、公式、图片、复杂列表/引用/callout 以整块替换为主，保持合法结构。
6. 原始 HTML 经过清理后才进入比较文件；react: 块显示组件名和转义代码，不运行历史交互；复制按钮不进入历史正文。
7. 比较模式禁用代码复制，防止复制旧新混合代码；最新版照常。
8. 先在完整文档上下文解析引用/脚注定义，再渲染块，不能逐块独立编译丢失依赖。
9. 文本转义，旧渲染内容过滤脚本、事件属性、危险 URL；具体过滤库 API 在实施前查官方文档。
10. 图片只用原 URL，不归档二进制；失效沿用错误占位与 alt。历史内链按当前站点解析，不承诺旧站点还原。
11. token diff 使用成熟依赖，具体选型在实施前核查官方文档；仅构建端使用。

上述协议与算法为本项目设计，不声称为参考站内部实现。

## 6. UI 集成、目录和 URL

BlogPost header 后放 RevisionReader。最新模式保持 SegmentsRenderer；比较使用独立静态 HTML renderer，memo innerHTML 对象，避免 React 19 重建图片。

当前标题 id 根据当前正文产生并在比较复用；旧标题/旧块引用加 old-{revision}- 前缀，旧内部引用同步重写。
不将 diff HTML 直接交给 useHeadingAnchors 正则，否则旧文字混入目录。比较用产物 toc，仅包含当前标题。
切换后刷新图片、目录、阅读进度/hash；滚动使用 useScrollTarget，支持移动端独立容器。比较与最新图片预览分组隔离。

URL 为 /blog/{slug}/?compare={fullCommit}，移除 compare 恢复最新，保留其他合法参数和 hash。比较对象始终是当前部署最新版，因此跨部署同一链接的目标可能前移。
SSG 与客户端初次 render 均最新，挂载后读取 query，避免水合错配。
用 wouter 查询订阅/导航支持前进后退，实施前核对官方 API。
请求按 slug+generation+revision 校验并可取消，旧响应不能覆盖新状态；loading 保留最新版。

canonical 保持带尾斜杠文章 URL；历史不进搜索/Feed/sitemap。静态主机无法按 query 提供不同 robots meta，不承诺服务端 query 专属 noindex。

## 7. 文件与规范落点

- scripts/build-posts.js；新建 scripts/lib/revision-diff.js 和 scripts/build-history.js。
- scripts/static-renderer.js：只注入当前文章小索引。
- package.json、plugins/vite-plugin-content.js、现有 .github/workflows 工作流：构建顺序、开发重建、完整历史、严格 CI。
- src/hooks/useArticleRevisions.js；src/components/RevisionReader.jsx + CSS Module；src/pages/BlogPost.jsx。
- .gitignore 与 frontend content/SSG/hooks/quality 规范。

quality-guidelines 禁止运行时后端和全站数据拉取；本实现补充允许同源、构建产出的单篇正文/历史资源，保留无后端和禁止全站正文注入约束。

## 8. 发布与回退

先验证临时 Git fixture 和已有文章，再全站测量时间与 gzip 体积。严格 CI 失败阻止发布；客户端历史加载失败保留最新版。
停止 history 生成步骤并重新构建即可回退，清理历史生成目录不改写用户文章/Git。部署不在本轮范围。
