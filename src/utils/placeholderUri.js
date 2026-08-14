/**
 * 懒加载占位图（唯一来源）。
 * 构建脚本（scripts/build-posts.js 写进 HTML src）与客户端（src/utils/lazyImages.js
 * 主题切换换色）共用本模块，改占位图设计只改这里。
 * 构图：暗底/亮底 + 等宽终端 prompt「cicada@blog:~$ loading」+ CSS 闪烁光标；
 * 光标动画在 prefers-reduced-motion 下关闭。色值均为低对比（主题前景色 ~30%）。
 */

function placeholderSvg(bg, fg) {
  return (
    'data:image/svg+xml,' +
    encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><style>
  @media (prefers-reduced-motion: reduce) { .cur { animation: none } }
  .cur { animation: blink 1s steps(1) infinite }
  @keyframes blink { 50% { opacity: 0 } }
</style><rect width='800' height='600' fill='${bg}'/><text x='400' y='310' text-anchor='middle' font-family='monospace' font-size='28' fill='${fg}'>cicada@blog:~$ loading</text><rect class='cur' x='589' y='282' width='16' height='30' fill='${fg}'/></svg>`)
  )
}

/** 暗色版（默认；站点主视觉） */
export const PLACEHOLDER_URI = placeholderSvg('#0c0c0a', '#3a3a35')

/** 亮色版（主题切换用） */
export const PLACEHOLDER_LIGHT_URI = placeholderSvg('#f4efe6', '#b8b3ab')
