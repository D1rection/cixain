# 技术设计：源标题解析到实际网页 ID

## 1. 现状与选择

`parseWikiTarget` 负责文件名/类型/同文/块引用的语法解析，保持纯函数；它不具备目标标题信息，不承担标题到 ID 的转换。新增构建期解析层，消费编译产出的标题索引，返回最终目标。

不选择“只放宽校验”：生成 href 仍然失效。不选择“对链接标题直接 slugify”：重复标题的后缀、已有块 ID 和富文本标题均无法可靠推算。不选择“从已有生成 HTML 预扫”：内容可能已修改、生成文件可能不存在或过期。不重复编译全站。

推荐在内存中准备全部内容树，再统一解析链接、校验及序列化。最终 DOM ID 是定位事实；源标题是作者使用的名称。

## 2. 标题与引用元数据

每个可见文档建立 `DocumentAnchorIndex`：`headings`（按正文顺序）、`anchors`（最终全部 ID）、`blocks`（实际块 ID）。标题项包含 `title`、必要的 `textTitle`、`id`、`level` 与可用的源位置；内存索引以 `post:<slug>` / `fragment:<slug>` / `page:<slug>` 隔离。

在 Markdown AST 阶段保存标题语义及来源关联，绑定到同一标题节点；行内 strong/emphasis/code/link 取其文字，inlineMath 的 title 保留 `$…$`，textTitle 可取公式源码文字。清除标题末尾合法 ` ^id`，不把其当标题文字。不能把最终 KaTeX 子树的所有 text 拼起来当源标题。

元数据通过编译期间的临时节点标记或位置表传递。在 `rehypeBlockRef` 和 `rehypeHeadingAnchors` 完成后，读取对应节点最终 ID；h2–h6 才登记为本任务可定位标题。折叠题干已经转为 div，不登记；HTML 原生 h2–h6 的普通文字标题可在 KaTeX 前记录。临时标记必须在 stringify 前移除，不进入 HTML、搜索文本或历史比较。

wiki 引用保留 `syntax: wiki`、原始 target、完整作者写法、position，以及到生成 a 节点的稳定关联。普通 Markdown/HTML 引用标记为 `syntax: url`。`anchor` 保持解码一次后的作者输入，另存 `resolvedAnchor`，不覆写诊断原文。

现有 remark-obsidian-link 会用新 link 节点替换 wikiLink，丢失原节点 position/data；toLink 返回值也不能携带自定义属性。集成时在替换前记录父节点/槽位及源信息，紧接替换后给生成的 link 恢复 position 和临时引用关联，再进入 remark-rehype。这两个步骤之间不得插入改变节点顺序的插件；以夹具验证关联准确性，不依赖回调调用次数或全站队列顺序。

## 3. 解析规则与歧义

标题比较只归一化首尾空白及连续空白，不移除标点，不转小写，不对标题做 slugify；文件寻址沿用现有严格规则。别名只影响显示文字。

| 引用情况 | 处理 |
| --- | --- |
| wiki 没有 hash | 保持当前页面链接 |
| wiki `#^id` / 同文 `^id` | 严格匹配 blocks；不尝试标题转换 |
| wiki `#标题` | 先精确匹配 title；未命中再匹配 textTitle；取对应最终 ID |
| wiki 无标题匹配，但 hash 是实际 ID | 保留旧 ID 写法 |
| 标题匹配与同名实际 ID 指向同一元素 | 正常解析 |
| 标题匹配与同名实际 ID 指向不同元素 | `ambiguous-anchor`，不静默选择；提示用块引用，或普通 Markdown URL 明确指定实际 ID |
| 完全相同标题重复 | 默认取正文顺序第一个；明确定位其他标题使用块引用 |
| textTitle 归一后对应不同源标题且无法唯一选择 | `ambiguous-anchor`；精确的含公式 title 仍可区分 |
| 普通 Markdown/HTML URL | 原 hash 直接匹配实际 ID，不按标题转换 |
| 没有匹配 | 延续 missing-anchor；提示检查目标原始标题或 `^块ID` |

不同源标题的 slug 碰撞必须通过各自的实际 ID 区分，例如 `A.B → ab`、`AB → ab-1`。标题项不能存成 slug → 单个标题的反向表。

生成地址仍调用 `contentUrl` / `routePath` 并统一编码 hash。同文标题链接通常生成 `#<encoded actual ID>`。两处实际案例将分别生成 `/blog/2026-08-21-001/#33-softmax-%E5%9B%9E%E5%BD%92` 与 `/blog/2026-08-12-001/#1-%E6%A2%AF%E5%BA%A6%E4%B8%8B%E9%99%8D%E6%B3%95`（含现有 base 时由路由工具补齐）。

## 4. 编译边界

将现有 compileMD 内部拆成 prepare/finalize 两个阶段；命名可为 `prepareMD`、`finalizeMD`，但不为此建立通用插件框架。

```text
收集本次可见内容 registry / allContent
  → 每文档 prepare：parse + run 现有转换链
  → 保存最终树、标题/块/ID 索引、wiki 关联和源信息
  → 建立本次完整标题索引
  → finalize：解析 wiki，修改关联 a.href，收集普通 URL 引用
  → 对同一解析结果执行发布校验
  → stringify 内容树，计算依赖最终 HTML 的描述与 pagesData
  → 写 HTML/JSON/锚点索引
```

prepare 保留既有插件次序，特别是折叠标题、Shiki/KaTeX、块 ID、标题 ID 的先后关系。Shiki/KaTeX 每份源内容只执行一次。实现使用 process 的非字符串 compiler 结果保留 HAST，VFile 保存源码和 interactive 等 file.data，再单独 stringify；无需新增 VFile 依赖。标题语义在行内高亮等 Markdown 转换之后、remark-rehype 之前保存，仍早于 KaTeX。

finalize 从明确标记的 wiki a 节点读取关联，不能用 href 去猜链接来源。普通 URL 收集跳过已关联 wiki 节点，避免解析前后的两个 hash 被当成两条引用。所有输出缓存到校验通过以后；新增文件也属于门禁范围。

`compileMD` 保留当前参数与 `{html, interactive, anchors}` 返回字段，作为 prepare/finalize 的单文档包装器，可额外返回 headings；传入外部 anchorIndex 时可解析跨文档标题，没有外部索引时仍能解析同文标题。缺少跨文档索引时不伪造解析成功，维持既有 best-effort 地址并允许调用者检查 unresolved；全站发布流程必须使用完整索引。

`buildPosts` 使用分阶段 API，单文档历史/测试继续使用 compileMD 包装器。不要让调用者自行配置另一套标题转换规则。

## 5. 校验、索引与页面消费者

校验器使用 wiki 的 resolvedAnchor，普通 URL 使用原 anchor；文件缺失/未发布诊断仍优先于标题诊断。块引用仍使用 blocks。歧义和缺失解析返回结构化诊断，不在解析器内部抛不可定位错误。原始 raw/position 保留，稳定去重使用规范目标且保留来源类型。

目录与搜索继续消费最终 HTML ID，不重新推算标题 ID。搜索 wikiLinkLabel、反向链接 targetId 和 registry 类型优先级保持原契约。`useHashScroll` 已有一次解码及异步内容就绪后的定位逻辑，当前设计无需前端解析标题或修改滚动代码。

为独立进程运行的 build-history 输出构建中间文件 `content/anchor-index.json`：`schemaVersion: 1` 与仅含本次可见内容的索引。添加对应 .gitignore 条目。它只由 build-posts 生成，build-history 消费，不进入 posts/fragments 元数据、搜索最终产物或页面内联数据。索引不能来自上次构建残留；生产构建顺序继续为 posts → history → Vite。失败的本次 posts 构建不得覆盖旧索引或继续执行 history。

## 6. 历史版本策略

历史链接采用“当前可访问内容”策略，复用同一标题解析器和刚生成的 anchor-index；不按每次 Git 提交重建整站索引。

历史 wiki 同文引用也生成当前文章的规范 URL，不使用比较视图中的局部 hash。原因是 BlogPost 的 addComparisonHeadingIds 会把比较正文标题 ID 改为 revision-heading-*，原来的局部章节 ID 不再可靠。历史跨文档和同文 wiki 标题/块链接都指向当前可见正文；普通 Markdown URL 保留原语义。本策略只影响历史 wiki 地址，当前正文同文链接继续使用局部 hash。

历史旧标题在当前文档不存在时保留 best-effort 地址并输出历史告警，不将其纳入当前已发布正文的严格引用门禁；不凭 slugify 猜测。缓存 compilerVersion 增加本次内容编译语义版本，确保旧比较资源不被复用。索引缺失或版本不支持时按历史生成器已有 strict/非 strict 策略处理，不默默用空表宣称成功。

## 7. 兼容与风险

现有 ID 生成算法保持原样，包括公式标题目前由最终渲染文字生成 ID 的行为；本任务解决作者名称到实际 ID 的映射，不顺带更改所有公式标题 URL。一般性的 heading/block ID 碰撞治理独立于本任务，不能为“唯一化”悄悄迁移旧 ID。

保留内容树会增加构建峰值内存，当前站点规模可先采用简单内存实现；实施时记录完整构建耗时和峰值内存，并确认不是二次转换。重置每次构建上下文，避免开发重建复用旧 Map 或节点。

同一 wiki hash 同时作为标题和不同元素 ID 的情况，本设计选择明确报歧义，以保护已有链接的意义。完全重复标题取首个是项目约定，官方文档未给出其完整歧义算法，不宣称这是 Obsidian 全量行为。

## 8. 变更范围与回滚

预计改动：build-posts 的分阶段编译与节点关联；构建期标题索引/解析模块；content-validation；build-history 的索引输入与缓存版本；内容/历史测试；.gitignore、两份内容规范及碎片写作指南。parseWikiTarget 的原始语法契约尽量保持不变。

不改文章正文、既有 ID 算法、网页交互或部署脚本。回滚编译、校验、历史消费者与生成索引契约作为一个完整变更，重新运行全量构建；只撤销本任务代码与构建产物，不回滚用户正文或其他工作。

## Review Gate

2026-10-01 用户以“实施”确认方案，task.py start 已执行。歧义报错、完全重复标题取首个、历史 wiki 导向当前正文均按此方案实现。
