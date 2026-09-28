# 验收记录（2026-09-29）

实现：@tanstack/react-virtual 3.14.13 / virtual-core 3.17.11；React 19；overscan=5。搜索计算和索引协议未变。

## 浏览器
macOS Google Chrome 154.0.8037.57，无头模式，Playwright 1.63.0。测试使用路由拦截提供 0/1/10/1000 条真实索引形状的混合高度数据，没有写入站点内容。

- 1280×800、390×844、320×844：结果数正确，无更多按钮；首屏、中段、尾部和改变宽度后的连续条目无重叠/空洞；所有采样 DOM option ≤40，末项 999 可达。
- 连续 35 次 ArrowDown 跨越第 10 项和视口，当前项滚入可见区；屏外活动项保留 DOM，aria-posinset/setsize 正确。手动滚到中部不回跳。
- 桌面/窄屏互换，首个可见条目误差 ≤2；字体切换并模拟 FontFaceSet loadingdone 后重新测量；CSS zoom 200% 条目几何检查通过。
- 深处改查询、空结果、关闭重开正确重置；模拟 compositionstart/Enter/compositionend 未跳转；正向/反向 Tab 环、Esc、焦点恢复正常。
- 普通点击和 Enter 实际导航通过。Meta-click、中键及合成 Ctrl-click 的默认事件未被组件阻止，弹层不关闭。当前无头 Chrome 对独立原生链接也无法触发可靠的新标签页事件，因此不声称系统新标签页行为已实测。
- 索引 503 后重试成功。

未实测：VoiceOver/NVDA 的实际播报、真实手机及软键盘、浏览器菜单的原生 200% 缩放、系统中文输入法确认。CSS zoom、合成 composition/font 事件不能替代这些设备级验证。

```json
[
  {
    "width": 1280,
    "height": 800,
    "domCount": 11,
    "lastIndex": 999
  },
  {
    "width": 390,
    "height": 844,
    "domCount": 12,
    "lastIndex": 999
  },
  {
    "width": 320,
    "height": 844,
    "domCount": 12,
    "lastIndex": 999
  },
  {
    "results": 0,
    "domCount": 0
  },
  {
    "results": 1,
    "domCount": 1
  },
  {
    "results": 10,
    "domCount": 10
  },
  {
    "nativeLinks": "click/Enter navigation passed; modifier/middle default event contracts passed; actual new tabs not verified",
    "retry": "passed",
    "zoom": "CSS zoom 200% passed",
    "focusRestore": "passed"
  }
]
```

复现：先启动 Vite dev（避免运行会改内容的生产构建），在仓库外安装 Playwright，然后执行：

```sh
PLAYWRIGHT_MODULE=/tmp/cixain-browser-tests/node_modules/playwright/index.mjs node .trellis/tasks/archive/2026-09/09-29-search-virtual-list/research/browser-check.mjs
```

可设置 TEST_BASE_URL 与 CHROME_PATH；默认测试 http://127.0.0.1:5176。测试截图位于 /tmp/cixain-search-{1280,390,320,zoom}.png。

## 构建与检查
在独立临时副本执行完整生产构建与 revisions 测试，避免覆盖工作区原有生成文件修改。npm run build 成功，SSG、SEO 与搜索索引生成成功；npm run test:revisions 为 9/9；git diff --check、Trellis context 校验通过。仓库无 lint/typecheck 命令。

主 JS 同一工作区副本的 Vite 构建对比：311.95 → 340.35 kB，gzip 103.33 → 111.78 kB，增加 28.40 kB / gzip 8.45 kB。虚拟化限制 DOM 成本，不减少全量索引下载和同步搜索成本。

## 修复的边界
窗口宽度变化时，行 ResizeObserver 与缓存清除可能交错。现在提前保存阅读锚点，清除屏外缓存，显式重测已挂载行，再即时及下一帧恢复锚点。显式测量使用 offsetHeight，避免 CSS zoom 后的屏幕矩形尺寸污染布局缓存。键盘滚动请求与鼠标选择分离，避免手动滚动被拉回。

## 提交
验收后用户已授权提交、归档和推送。具体文件分组及排除项见 commit-plan.md；提交结果记录于开发者 journal。
