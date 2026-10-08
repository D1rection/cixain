# 实施核验（2026-10-09）

## 已完成

- 新增 DOM-free 共享解码函数，普通正文与历史目录均先去标签再解码一次。
- 普通目录保留原始去标签文字作为旧 slug 输入；正文编译器和目录组件未改变。
- entities 6.0.1 声明为直接依赖，锁文件只增加根依赖声明。
- 历史 COMPILER_VERSION 加 toc-text-1，生产构建更新 posts.json 中历史资源指针。
- 更新 hook 与内容管线规范，记录单次解码、顺序和锚点兼容约束。

## 自动验证

- npm run test:content：28/28 通过。
- npm run test:revisions：10/10 通过。
- npm run build：通过，完成内容、历史、OG、Vite、SSG、SEO 和搜索索引。
- 实际生产 SSR 页面断言：目录文字为 `4.2 Necessary conditions & Suﬃcient conditions`，href 保持 `#42-necessary-conditions-amp-sucient-conditions`，没有目录双重转义。
- 历史 fixture 验证：实体字面量、编码标签、空白处理、目录编号、版本变化导致新 generation，相同版本重建 generation 稳定。
- 未配置 lint/typecheck 脚本，未声称运行。
- git diff --check 针对本任务代码、测试、依赖和 Trellis 文档通过。全工作区仍有原有 public/feed.xml 尾随空白，不在本任务修改范围。

## 页面验证

生产预览 http://127.0.0.1:4175/ ：

- /blog/2026-10-09-001/：浏览器水合后 TOC 与正文都显示 &；点击目录可以定位章节，已有 hash 可直接打开。移动与桌面目录核验完成，文章页无 React 水合报错。
- /fragment/mnist-format/：目录和标题正常，无控制台错误。
- /blog/2026-10-05-002/?compare=33553484356195d0230e6e322f85658367bb9d2e：比较正文加载成功，目录使用 revision-heading-N。
- 预览截图保存于 /tmp/cixain-toc-preview.jpg。

## 既存问题与边界

直接打开历史比较参数链接时出现 React #418 水合不一致警告，比较正文随后仍正常加载。已在临时副本中还原 HEAD 的 useHeadingAnchors，重新执行 Vite 和 SSG，通过另一预览端口访问同一链接，复现相同 #418，确认不是本次目录解码引入。

源代码迹象：静态页面按无查询参数 URL 生成，而 RevisionReader 初始 expanded 取决于 compareId，服务端与直接带查询参数打开的客户端可能不同。本任务未改该组件、路由或历史加载 hook，未扩大范围修复。该原因属于代码分析，原 hook 对照复现属于实测证据。

## 工作区保护与审查

生产构建前备份所有已有非忽略 public 文件，构建后恢复并逐字节验证，保留用户原有资源改动。新历史资源与 dist 保留供预览。posts.json 修改只涉及历史版本地址与 generation，属于本修复对应的重建结果。

frontend 为唯一 spec 层，已审查相关 hook、内容管线、SSG、组件和质量规范。未改变正文、标题算法、样式、全站数据分发或比较 schema；未新增运行时请求。缺少 trellis-before-dev/check/update-spec 技能文件，依据可用 workflow 与 spec 手工完成相应阅读、检查与规范更新。

已核查官方 [entities 文档](https://github.com/fb55/entities) 与 [React 服务端渲染文档](https://react.dev/reference/react-dom/server/renderToStaticMarkup)，并对照实际安装版本；Context7 本次没有可调用工具。

代码与验证完成。2026-10-09 用户已授权归档、提交并推送，按 commit-plan.md 执行。

## 收尾

2026-10-09 用户明确授权归档、提交并推送。工作提交：`ae3028107c0455ada116f4e5b17c48158159bacf`。任务归档与日志分别提交后统一推送 origin/main；原有无关修改不包含在本次提交中。
