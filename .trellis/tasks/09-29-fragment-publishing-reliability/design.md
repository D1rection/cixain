# 技术设计

## 1. 统一目标解析
新增纯函数模块（建议 src/utils/contentLinks.js），接收 raw、当前 kind/slug，返回 kind、slug、anchor、blockRef、sameDocument 或结构化错误。解析器不读取文件、不访问 DOM、不依赖可见性；由 registry 决定目标是否存在及发布。

| 写法 | 任意来源页的目标 |
|---|---|
| [[name]] / [[post/name]] / [[posts/name]] | post:name |
| [[fragment/name]] | fragment:name |
| [[#heading]] / [[#^id]] / [[^id]] | 当前内容 |
| [[fragment/name#^id\|别名]] | fragment:name 的块，显示别名 |

别名交给 Markdown 插件现有输入，不手写整段 Markdown 正则。slug 按文件名匹配，百分号转义只解码一次，非法转义给出诊断；URL 由 contentUrl 统一编码。不要按标题猜测、跨类型回退或改变同名内容优先级。先审计现有 fragment 无前缀链接，再报告需要补前缀的旧写法。

build-posts.makeToLink 与 build-search-index.wikiLabel 调用同一解析器；反向引用使用其 canonical targetId。展示标题必须来自目标 registry，别名优先，不允许错误借用另一类型的同名标题。

## 2. 发布清单与引用检查
区分全部内容清单与本次可见内容清单。全部清单用于区分缺失/草稿/未来内容及提供修复建议；生产输出只消费可见清单。已发布来源指向不可见目标视为失效，不因此发布目标。

收集 wiki 引用和指向站内 /blog/、/fragment/ 的普通 Markdown 链接（包括不存在的目标）。编译 HTML 的 heading/block ID 是锚点验证依据；同文锚点也检查。普通外链、图片资源、首页及其他站点页面不误报。静态 pages 若含内容链接也纳入来源检查。

诊断格式含 code、sourceFile、sourcePosition（能取得时）、raw、targetId、reason、hint。稳定去重，避免 wiki 生成的 a 标签二次计数。默认开发告警、生产严格；在写输出前完成校验，失败非零退出，防止半套内容发布。命令入口和 Vite dev 插件传递显式模式，不让进程 argv 决定纯函数行为。

历史兼容：首次审计若无历史问题，不引入基线文件；若确有暂不能修复的历史问题，使用人工审核的精确三元组 sourceId/targetId/anchor + code 白名单，并注明原因。新问题不进入白名单，旧问题修复后删除豁免。既有草稿内容不作为生产校验来源。实施中不得为了通过检查修改用户未提交正文。

## 3. 模板与日期
Templates/new-fragment.md 加 draft: true，保留最少正文占位；教程移至单独写作指南（建议 docs/writing-fragments.md），模板以 YAML 注释指路。指南解释首次公开日期、实质更新、发布开关、跨类型链接和改名会改变 URL。既有 fragment 不自动补 draft 或更改日期。

日期纯函数输入为 YAML Date 或严格 YYYY-MM-DD 字符串；拒绝时间戳字符串、未替换占位符、数字、非法日期与类型。YAML Date 按当前日期-only 兼容契约取日历日期，避免时区漂移；输出 date/updated 均为 YYYY-MM-DD，updated 空值为 null。真实日历校验拒绝 2 月 30 日和非法闰日；updated < date 报错。未来 date 按 Asia/Shanghai 日历日控制可见性，开发是否预览未来内容保持当前行为，避免隐式扩展。

草稿允许暂未填写 date/title，生产先识别合法 draft:true 后跳过必填发布校验；开发展示草稿时要求可显示的最小字段并提示，不伪造公开日期。非空但错误的字段需可定位诊断。draft 缺失兼容 false，字符串 'false' 不得按 truthy 悄悄过滤。共享函数可被文章复用，但本任务不强制收紧所有历史文章日期输入；通过文章回归夹具约束范围。

## 4. 页面加载
FragmentPage 保留 SSG 内联正文优先路径。需获取正文时用 BASE_URL 拼接 content/fragment/<encoded-slug>.html；请求状态绑定 slug 和请求序号，使用 AbortController；切换立即隐藏上一页正文。显式 loading/error/success，AbortError 不展示失败；错误提示和按钮仅替换正文区域，标题保留。重试只针对当前 slug，响应需校验为预期正文，不能把静态托管回退的整站 HTML 当成功结果。

缺失 meta 与正文获取失败分开：前者显示友好未找到状态，不暴露调试 slug；后者可重试。已有图片懒加载、目录、hash 滚动继续在当前成功正文上工作。保持 CSS Modules，清理监听和请求。

## 5. 兼容、成本与回滚
不新增运行时依赖。链接与索引共享解析改动必须一起发布，防止短期语义不一致。新模板只影响以后创建的文件；既有内容迁移需明确审计清单。严格校验可能暴露历史失效链接，先在副本验证再启用发布门禁；不得静默放宽全局校验。回滚发布校验、解析器消费者及测试应作为同组；不回滚用户写作内容。
