# 实施顺序与验收

状态：已进入实现阶段。

## 1. 准备与真实回归

- [x] 实施前读取 frontend 的 component/hook/content-pipeline/typography/quality/ssg 规范，检查用户未提交改动，特别是 scripts/build-posts.js。
- [x] 以 PRD 中两次固定 commit 的文章正文作为真实回归样本，并以最小 fixture 覆盖长插入导致参考重复、KaTeX 修改损坏。
- [x] 库 API 先查询 Context7；当前环境无该工具且本任务未引入新依赖，改用现有 HTML 编译结果和本地回归契约实现，并记录依赖决策。

## 2. 对齐与保真（最高优先级）

- [x] 实现语义块提取、指纹、唯一锚点与区间序列对齐，覆盖重复段落和较大插入。
- [x] 实现保结构行内修改、中文字素粒度、公式/代码原子节点及安全的完整块降级。
- [x] 覆盖链接只改 href、图片只改源、公式只改源、顶层公式、标题编号变化、空文章与超预算降级；验证 unchanged 内容不会因提取器遗漏而丢失。
- [x] 检查旧/新内部 ID、引用与当前目录映射，保留既有交互降级和安全过滤。

## 3. 分组、静态契约与阅读交互

- [x] 生成分组 HTML 及 changes 清单，changeCount 统一按区域计数；更新构建脚本 schema/compiler 代际。
- [x] RevisionReader 与文章正文接入计数和上一处/下一处；处理切版本、回到当前、空变化、加载失败、首尾边界及键盘焦点。
- [x] 调整 PostContent 样式：组级红绿标记、保正文排版、复杂内容免删除线、明暗色变量、窄屏换行。

## 4. 验证与交付

- [x] `npm run test:revisions`，测试断言语义内容与变化位置，不锁定整篇易碎 HTML 快照。
- [x] `npm run build`，跟踪进程直到实际退出成功，不能仅以 build-posts 完成判断整站成功。当前 package 无 lint/typecheck 命令，不虚构已运行。
- [x] 在构建产物预览中打开固定文章比较，检查真实公式、参考列表、TOC、长新增区域及链接。已视觉检查桌面、窄屏、明暗主题和键盘定位。
- [x] 校验直接 compare 访问、浏览器前进后退、版本切换、失效资源回退、回到当前。已在本地预览逐项验证；未单独构造仅 generation 不匹配但 JSON 可解析的异常资源。
- [x] 全范围复核 PRD；已更新内容管线规范中的语义比较、公式原子及区域计数约定。
- [x] 汇报实际通过项与残留限制，按后续授权提交/归档/发布，仅包含本任务文件。

## 主要修改位置

scripts/lib/revision-diff.js；scripts/build-history.js；tests/revisions/；src/components/RevisionReader.jsx 及 CSS；src/components/PostContent.module.css；src/pages/BlogPost.jsx；必要时 src/hooks/useArticleRevisions.js 与目录定位逻辑。scripts/build-posts.js 仅在确认解析复用确有必要后最小改动。

## 里程碑

1. 算法回归通过：参考不重复、公式保真。
2. 分组契约通过：计数、导航、目录一致。
3. 视觉和整站验收通过，形成可供用户检查的预览。

每阶段若失败回到对应步骤；不以调色掩盖对齐错误。任务采用默认 Codex inline 流程，无需 JSONL 子代理上下文。
