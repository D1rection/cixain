# 验收记录（2026-09-29）

## 实现范围
统一 wiki 目标/显示标题解析；严格生产引用门禁；模板默认 draft 与独立指南；fragment 日期和 draft 类型验证；正文加载/失败/重试/取消；中文标题 hash 定位。修复一条已提交文章的旧标题链接，未修改用户正在编写的碎片或新文章。

## 自动化与生产构建
- `npm run test:content`：7/7 通过，覆盖双向与同名链接、别名、转义、同文引用不二次解码、跨时区日期、非法日历值、草稿/未来目标、普通链接、标题/块校验、重复块、验证失败不改生成文件、空模板不渲染教程。
- `npm run test:revisions`：9/9 通过。
- `npm run build`：在独立副本通过。最终构建通过 GIT_DIR 指向原仓库供历史脚本只读访问，并用 GIT_WORK_TREE 指向副本，生成文件全部在副本；16 篇文章生成历史版本，2 篇工作区正文未提交按既有规则跳过历史比较。
- 草稿残留场景：临时副本先用 --dev 生成 __draft-verification.html，再生产构建，验证 route/body/search/sitemap/feed/registry 中不包含该草稿或正文标记。
- `git diff --check`、Trellis context validation 通过。无 lint/typecheck 脚本，不声称运行过。

## 浏览器
macOS Chrome 154，无头 Playwright 1.63；390×844。在独立副本以实际 FragmentPage、Router、ScrollProvider 与上下文组成夹具，分别运行根路径和 /notes/ BASE_URL：

- 404、网络断开、HTTP 200 整站 HTML 回退 → 明确失败并可重试。
- 慢请求显示加载状态；切换 A→B 后旧 A 响应不能覆盖 B；B→A 等待期间不显示 B 正文。
- 中文标题 hash 可定位；缺失 metadata 显示友好未找到，不展示调试 slug。
- 内联正文不额外 fetch；所有正文请求使用当前 BASE_URL。
- 生产 dist 的真实 /fragment/mnist-format/ 页面窄屏打开和水合正常，0 次额外正文请求，无 pageerror。截图：/tmp/cixain-fragment-ssg.png。

未验证真实移动设备、系统读屏器；/notes/ 检查针对碎片组件请求与路由状态，未宣称全站所有模块都已完成子路径部署适配。

## 浏览器复现
在隔离副本根目录复制 research/fragment-fixture.jsx 和 fragment-fixture.html（两文件仅用于测试，不加入应用入口）。运行 Vite，根路径无需配置，子路径用 VITE_BASE_URL=/notes/。在仓库外安装 Playwright，再运行：

```sh
PLAYWRIGHT_MODULE=/tmp/cixain-browser-tests/node_modules/playwright/index.mjs TEST_BASE_URL=http://127.0.0.1:5178/notes node .trellis/tasks/archive/2026-09/09-29-fragment-publishing-reliability/research/browser-check.mjs
```

## 风险与边界
生产门禁会有意阻止以后新增的失效内容引用；普通外链可用性不检测。现有 fragment 未自动加 draft；模板默认只影响新建文件。日期严格规则限于碎片，不收紧历史文章。新增编译结果锚点与元数据缓存在内存中，增加构建时内存用量；运行时无新增依赖。验证通过后才写文件，不宣称磁盘故障下具备事务回滚。用户已授权提交、归档和推送，完成结果记录于开发者 journal。
