# 内容发布与引用校验

## Scope / Trigger
文章、碎片或静态页面的内容编译，以及碎片 frontmatter、搜索双链文本和碎片页正文加载的变更，都必须遵守此契约。生产构建只输出本次可见集合，不能因被引用就发布草稿。

## Signatures
- `parseWikiTarget(value, {kind, slug})`：纯函数，返回 `{kind, slug, anchor, blockRef, sameDocument, targetId}` 或 `{error, reason, raw}`。
- `wikiLinkLabel(wikiLink, current, registry)`：别名优先，否则仅用目标类型的标题，最后回退文件名。
- `compileMD(...)`：返回 `{html, interactive, anchors}`，额外 anchors 是最终 HAST 的实际 ID。既有调用者可忽略新增字段。
- `buildPosts({dev = false, directory = contentDir} = {})`：默认生产；CLI 显式映射 `--dev`。返回 `{posts, fragments, diagnostics}`，directory 供隔离夹具使用。
- `fragmentFrontmatter(data, {file, dev, matter, now})`：返回归一化 data 与可见性 state。

## Contracts
无前缀及 post/posts 前缀在所有来源中指向文章，fragment 前缀指向碎片；#heading/#^id/^id 是同文。百分号解码一次，URL 输出统一编码，不按标题猜测。正文与搜索共用解析/显示规则。

引用收集保留来源、原写法、目标与可用的位置。wiki AST 在替换前收集；HAST 收集普通内容链接和最终锚点。相同 wiki 与生成 HTML 链接去重。allContent 区分缺失与未发布目标，registry 只含当前可见目标。

碎片 date/updated 输出 YYYY-MM-DD；日期字符串需为真实日历日；YAML Date 兼容日期-only，原始 scalar 也校验，防止 YAML 先把非法日历日期溢出归一。updated 可空但不得早于 date。draft 仅接受布尔值，缺省 false；新模板默认 true。草稿缺少 title/date 在生产跳过，在开发告警并暂不预览，不编造发布日期；非空错误字段仍应诊断。未来日期以北京时间日历日判断，开发不额外放行。

生产引用检查通过前不写 HTML/JSON；这是验证门禁，不是文件系统事务。没有自动历史豁免。文章原有日期接受范围保持兼容。

碎片页优先使用 SSG fragmentContent（包括空字符串）。否则以 BASE_URL 请求当前 slug 正文；状态绑定 slug，切换隐藏旧内容并取消请求。非成功 HTTP、非 text/html 或包含整站文档标记的响应进入可重试失败态。错误提示不影响标题；不存在的 meta 使用友好未找到状态。

## Validation / Error Matrix
| 场景 | 开发 | 生产 |
| --- | --- | --- |
| 缺失/未发布目标、缺失标题/块、重复块 | 告警，保留预览 | 失败，非零退出且不写内容产物 |
| 碎片非法日期/字段类型 | 告警并跳过该条 | 失败，指出文件和字段 |
| 缺少标题/日期的草稿 | 告警并跳过预览 | 排除 |
| 合法草稿 | 可预览并进入开发索引 | 不进入发布清单 |
| 未来内容 | 排除 | 排除 |

诊断包含 code/sourceFile/sourcePosition（可用时）/raw/targetId/reason/hint。普通外链、图片及非内容站点路由不视为内容引用。

## Good / Base / Bad Cases
- Good：碎片中 `[[posts/example]]` 生成 `/blog/example/`，同名碎片不影响选择。
- Base：旧碎片未声明 draft 继续发布；date YAML Date 和字符串输出同一日历日期。
- Bad：公开文章引用 draft:true 碎片，不能靠开发环境预览成功绕过生产检查。

## Tests Required
运行 `npm run test:content`、`npm run test:revisions`；发布验证在隔离副本运行 `npm run build`，避免覆盖用户内容和生成文件。覆盖同名类型、别名、中文编码、同文锚点、缺失目标、草稿/未来过滤、标题/块验证、多时区日期和错误时不写文件。

浏览器覆盖根路径/子路径、404/网络错误/HTTP 200 SPA 回退、重试、快速切换不串页、内联正文不重复请求。中文标题 hash 需在异步内容就绪后也能定位。

## Wrong vs Correct
- 错误：`let kind = current.kind` 后仅剥除 posts/ 前缀。正确：共享解析器将裸文件名和 post/posts 显式解析为 post。
- 错误：`new Date('2026-02-30')` 可被归一化便视为合法。正确：严格字符串形状与回转日历校验；YAML 原始 scalar 同样检查。
- 错误：请求失败写入空正文，或新路由暂时显示旧 body。正确：slug 绑定状态、清空显示、取消旧请求、显式重试。
