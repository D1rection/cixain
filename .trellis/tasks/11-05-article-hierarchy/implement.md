# 实现计划

## 实施边界

用户已授权实施，task.py start 已执行，当前 in_progress。单个任务覆盖一个完整的父子文章功能，不拆成可独立交付的子任务。

## 1. 内容关系与共享选择器

- [x] 读取本任务 PRD/design/research 与 frontend specs，核对用户最新决定。
- [x] 新增 scripts/lib/post-hierarchy.js，定义 parent 解析、祖先可见性、缺失/错误类型/自引用/循环诊断。
- [x] 在 build-posts 预扫阶段保存关系声明；生产在任何内容写入前门禁，开发排除无效节点及依赖后代并同步 registry/标题/编译集合。
- [x] 所有可见 post 输出 parentId，fragment 不接受 parent 字段、不生成关系字段。
- [x] 子文章遗留的 category/series/seriesIndex 不参与归属，输出统一归一为 null；顶层文章字段规则不变。
- [x] 新增 src/utils/postHierarchy.js 纯选择器，统一顶层范围与直接子文章稳定排序；保持 post 元数据总集合完整。
- [x] 在 tests/content 下添加真正验证图关系、数据边界与写入门禁的测试。

## 2. 顶部阅读入口

- [x] 新建 ChildArticles.jsx 与同目录 CSS Module，在 BlogPost 的 RevisionReader 之后接入。
- [x] 默认折叠，显示子文章数，展开为直接子文章标题链接；切换文章恢复折叠，空列表隐藏。
- [x] 添加直属父文章返回链接；历史比较不改变关系模块；子文章详情不展示分类和系列入口。
- [x] 使用真实内容 URL、唯一面板 ID、键盘可操作按钮与主题变量；不显示多级树，不触动修订比较逻辑。

## 3. 各列表/计数与数据分发

- [x] Home/Archive/Browse/FilteredList、taxonomy/series、Sidebar 及所有其他 posts 消费点使用同一顶层选择规则；过滤发生在计数、排序和分页前。
- [x] PostEnd 顶层页只从顶层找上下篇/推荐，子文章隐藏该两部分并保留分享/版权；子文章不展示系列位置。
- [x] static-renderer 各正常页面统一注入完整文章元数据，标签/系列路由从顶层集合派生；所有公开子文章仍生成详情与正文资源。
- [x] build-seo 的 feed 排除子文章，sitemap/已有推送候选保留公开详情；分类配置与 RSS 分类排除规则保持独立。

## 4. 搜索与写作支持

- [x] build-search-index 显式携带可选 parentId/parentTitle，SearchResultsList 给子文章显示父文说明；旧搜索索引兼容，碎片不出现关系说明。
- [x] 验证新增说明不破坏虚拟列表动态高度与键盘选择；不改搜索排序。
- [x] 新增子文章模板和 docs/writing-child-articles.md，模板不包含 category/series/seriesIndex，示例同时涵盖 post/fragment 区别与父链发布；不向真实博客填充演示文章。
- [x] 将最终确认的契约更新到 content-pipeline/content-validation/ssg-pipeline/component-guidelines，必要时更新搜索展示约定。

## 5. 自动与产物验证

运行一次适当的内容与历史回归：

```sh
npm run test:content
npm run test:revisions
```

当前没有 lint/typecheck 脚本，不声称运行这些检查。若实现引入新的检查，应明确记录。

完整构建仅在临时副本执行（包含当前源码及必要依赖，排除 .git 之外的大型构建目录时保持历史构建所需 Git 数据），保存用户当前脏文件；当前 build-seo 由非空 CI 触发网络提交，IndexNow key 来自 public 文件；验证时取消 CI 和百度凭据，再在该副本运行：

```sh
env -u CI -u BAIDU_TOKEN npm run build
```

测试矩阵：

- [x] 旧文章全部无 parent 的结果兼容；空/null parent 是顶层，类型非法/裸 slug/wiki/URL/fragment 父亲均有明确诊断。
- [x] A→B→C、多个同级、同日期/中文 slug 稳定排序、很深的合法父链、循环和自引用。
- [x] 同名 post 与 fragment 不会错绑；碎片声明 parent 被拒绝；正文互引和 backlinks 不生成父子关系。
- [x] 存在但未发布/未来/不完整的父亲和祖先；草稿独立不发布；生产失败前 HTML/JSON/anchor-index 无任何新增或覆盖写入。
- [x] 开发的合法草稿链可预览，非法链及后代不会降级成首页文章；registry 与候选集合一致。
- [x] 子文章 showOnHome=true 仍隐藏；顶层 showOnHome=false 仍在原有其他列表；分页条数/分类/标签/系列计数只算顶层。
- [x] 子文章模板无分类/系列字段，遗留值归一为 null，详情及 SEO 不展示分类/系列归属，归档列表不出现子文章。
- [x] 所有子文章详情/OG/历史仍生成；feed 无子文章，sitemap 有子文章且无仅由子文章产生的标签/系列路由。
- [x] 各正常页面注入的 posts 元数据 ID 集合一致，不带其他文章正文；搜索同时包含 post、子 post、fragment。

## 6. 浏览器验收（隔离副本的生产预览）

- [x] 直接访问父/子文章、默认折叠、展开后标题跳转、返回父文、无历史但有子文章、空列表隐藏。
- [x] 比较历史版本、恢复当前版本、切页后折叠状态重置，关系列表不受比较正文影响。
- [x] 分类/标签/系列→父文章→子文章→首页，以及碎片→父文章→子文章，不能靠刷新补齐数据。
- [ ] 320/390px 与桌面、亮/暗主题、长标题、键盘焦点、reduced motion。
- [x] 搜索命中子文章显示父文说明，混合行高下尾项和跨视口键盘选择仍可用。
- [x] 根路径与非根 base URL 下所有父子链接有效。

若当前工具无法完成某项浏览器验收，明确写未验证，不用源码检查替代声称通过。

## 7. 完成与回滚

- [x] 最终全范围检查需求和受影响 spec，记录实际验证结果与限制。
- [ ] 检查所有脏文件，仅将本任务改动纳入提交计划；按 Trellis 工作流评审后提交，不提交用户已有改动、不自动推送。
- [ ] 回滚代码必须同时处理新增 parent 声明，或部署功能前完整产物，防止旧代码将子文章重新暴露为顶层。
- [ ] 用户评审设计并明确要求实现之后才 task.py start；完成实现后再走 finish-work。

详细结果与未实测边界见 [validation.md](./validation.md)。reduced-motion 有 CSS 支持，系统设置未实测；跨入口浏览器验证覆盖分类与碎片，系列集合与 SSG 已做产物验证。
