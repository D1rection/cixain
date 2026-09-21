import LazyLoad from 'vanilla-lazyload'
import { PLACEHOLDER_URI, PLACEHOLDER_LIGHT_URI } from './placeholderUri.js'

// 错误占位图（终端风），与占位图同构图（暗底 + 等宽 prompt），文案换 ✗ ERROR 提示加载失败
const ERROR_URI =
  'data:image/svg+xml,' +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><rect width='800' height='600' fill='#0c0c0a'/><text x='400' y='298' text-anchor='middle' font-family='monospace' font-size='28' fill='#3a3a35'>cicada@blog:~$</text><text x='400' y='344' text-anchor='middle' font-family='monospace' font-size='24' fill='#b0413e'>✗ failed to load image</text></svg>`)

let instance = null
const retryButtons = new WeakMap()

/** 判断图片是否仍在使用构建期的 loading 占位图。 */
function isLoadingPlaceholder(el) {
  const src = el.getAttribute('src')
  return src === PLACEHOLDER_URI || src === PLACEHOLDER_LIGHT_URI
}

/** 移除失败图片旁的重试按钮，避免成功后留下过期操作。 */
function removeRetryButton(el) {
  const button = retryButtons.get(el)
  if (!button) return
  button.remove()
  retryButtons.delete(el)
}

/**
 * 为失败图片添加一次性手动重试入口。
 * 按钮放在灯箱链接之外，避免点击重试时同时打开图片预览。
 */
function addRetryButton(el) {
  const existing = retryButtons.get(el)
  if (existing) {
    existing.disabled = false
    existing.textContent = '重试加载'
    return
  }

  const button = document.createElement('button')
  button.type = 'button'
  button.dataset.imageRetry = ''
  button.textContent = '重试加载'
  button.setAttribute('aria-label', '重试加载图片')
  button.addEventListener('click', event => {
    event.preventDefault()
    event.stopPropagation()
    if (button.disabled) return

    button.disabled = true
    button.textContent = '加载中…'
    el.classList.remove('error', 'loaded')

    if (instance) {
      // vanilla-lazyload@12.5.0 支持 force=true，复用原 data-src 且只发起一次请求。
      instance.load(el, true)
    } else if (el.dataset.src) {
      // 仅作为异常兜底；正常运行时 instance 会在入口模块中先行初始化。
      el.src = el.dataset.src
    }
  })

  const previewLink = el.closest('a[data-action="preview"]')
  ;(previewLink || el).insertAdjacentElement('afterend', button)
  retryButtons.set(el, button)
}

/**
 * 占位图跟随主题：仅替换仍处于占位态的图（src 还是 data URI 的），
 * 已加载（真实 src）/加载中/错误态（ERROR_URI）的图天然不受影响。
 */
export function setPlaceholderTheme(theme) {
  const uri = theme === 'light' ? PLACEHOLDER_LIGHT_URI : PLACEHOLDER_URI
  document.querySelectorAll('img.lazy').forEach((el) => {
    if (isLoadingPlaceholder(el)) el.src = uri
  })
}

/**
 * 初始化懒加载实例（SSG hydrate 与 dev 共用）。
 * 仅浏览器实例化；无 IntersectionObserver 时由库内建降级为立即全量加载（勿在此处提前 return）。
 */
export function initLazyLoad() {
  if (instance || typeof window === 'undefined') return
  instance = new LazyLoad({
    elements_selector: 'img.lazy',
    threshold: 200, // rootMargin 提前 200px 触发
    // .loaded 类由库默认 class_loaded:"loaded" 自动加，无需自定义
    callback_loaded: (el) => {
      removeRetryButton(el)
    },
    callback_error: (el) => {
      el.classList.add('error')
      el.src = ERROR_URI // 保留 alt 可读
      addRetryButton(el)
      console.warn('[lazy-img] failed:', el.dataset.src || el.tagName)
    },
  })
}

/** dev SPA 客户端导航后重扫 DOM（内容晚注入的场景） */
export function updateLazyLoad() {
  instance?.update()
}
