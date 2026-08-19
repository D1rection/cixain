import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs'
import { spawnSync } from 'child_process'
import { join, extname, basename } from 'path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeShiki from '@shikijs/rehype'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import { remarkObsidianLink } from 'remark-obsidian-link'
import { PLACEHOLDER_URI } from '../src/utils/placeholderUri.js'

const isDev = process.argv.includes('--dev')

const __dirname = new URL('.', import.meta.url).pathname
const contentDir = join(__dirname, '..', 'content')

// ── 构建期图片尺寸解析（防 CLS） ────────────────────────
// 只取图头 2KB（jsDelivr 支持 Range），解析 PNG/JPEG/WebP/GIF 尺寸。
// 失败一律返回 null（不抛异常），调用方跳过该图懒加载。dimCache 供 dev HMR 复用。
const dimCache = new Map() // url → { w, h } | null

function parsePNG(buf) {
  // PNG 魔数 8 字节后 IHDRA，宽高定于偏移 16/20
  if (buf.length < 24 || buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) return null
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}

function parseJPEG(buf) {
  // FF D8 后遍历 marker；SOF0/1/2 = FF C0/C1/C2，载荷内 height u16BE / width u16BE
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null
  let i = 2
  while (i + 4 < buf.length) {
    if (buf[i] !== 0xff) break
    const marker = buf[i + 1]
    // 独立 marker（无长度载荷）跳过
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue }
    const len = buf.readUInt16BE(i + 2)
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) }
    }
    i += 2 + len
  }
  return null
}

function parseWebP(buf) {
  // RIFF....WEBP；分 VP8X（extended）/VP8（lossy）/VP8L（lossless）
  if (buf.length < 30 || buf.toString('latin1', 0, 4) !== 'RIFF' || buf.toString('latin1', 8, 12) !== 'WEBP') return null
  const chunk = buf.toString('latin1', 12, 16)
  if (chunk === 'VP8X') {
    // VP8X header：字节 24 处 canvas 宽=24bit-1，高=24bit-1
    return { w: (buf[24] | (buf[25] << 8) | (buf[26] << 16)) + 1, h: (buf[27] | (buf[28] << 8) | (buf[29] << 16)) + 1 }
  }
  if (chunk === 'VP8 ' || chunk === 'VP8L') {
    if (chunk === 'VP8 ') {
      // key frame 头：'9D 01 2A' 后 u16LE 宽高
      if (buf[23] === 0x9d && buf[24] === 0x01 && buf[25] === 0x2a) {
        return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff }
      }
    } else {
      // VP8L：1 字节 signature 0x2f 后 4 字节打包宽高（各 14bit）
      if (buf[20] === 0x2f) {
        const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24]
        return { w: ((b1 & 0x3f) << 8 | b0) + 1, h: (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)) + 1 }
      }
    }
  }
  return null
}

function parseGIF(buf) {
  // GIF87a/89a 后宽高
  if (buf.length < 10) return null
  const sig = buf.toString('latin1', 0, 4)
  if (sig !== 'GIF8') return null
  return { w: buf.readUInt16LE(6), h: buf.readUInt16LE(8) }
}

function parseDimensions(buf) {
  // 按字节头识别格式；WebP 与 PNG/GIF 无歧义，JPEG 有独立魔数
  if (buf[0] === 0x89 && buf[1] === 0x50) return parsePNG(buf)
  if (buf[0] === 0xff && buf[1] === 0xd8) return parseJPEG(buf)
  if (buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF') return parseWebP(buf)
  return parseGIF(buf)
}

async function fetchImageDimensions(url) {
  if (dimCache.has(url)) return dimCache.get(url)
  let dims = null
  try {
    const res = await fetch(url, { headers: { Range: 'bytes=0-2047' }, signal: AbortSignal.timeout(10000) })
    if (res.ok || res.status === 206) {
      const buf = Buffer.from(await res.arrayBuffer())
      const parsed = parseDimensions(buf)
      // 非正/非有限尺寸视为解析失败（防后续 0 宽高的除零 → Infinity/NaN）
      if (parsed && Number.isFinite(parsed.w) && parsed.w > 0 && Number.isFinite(parsed.h) && parsed.h > 0) {
        dims = parsed
      }
    }
  } catch {
    dims = null // 网络/解析失败 → 跳过该图，构建不失败
  }
  dimCache.set(url, dims)
  return dims
}

// ── Lucide 图标加载 ────────────────────────────
const LUCIDE_DIR = join(__dirname, '..', 'node_modules', 'lucide-static', 'icons')
function loadIcon(name) {
  return readFileSync(join(LUCIDE_DIR, `${name}.svg`), 'utf-8')
    .replace(/<!--.*?-->\s*/s, '')
    .replace(/\s*class="[^"]*"/g, '')
    .replace(/\s*(width|height)="24"/g, '')
    .trim()
}

const CALLOT_ICONS = {
  note:     loadIcon('file-text'),
  info:     loadIcon('info'),
  abstract: loadIcon('diamond'),
  warning:  loadIcon('triangle-alert'),
  question: loadIcon('circle-help'),
  tip:      loadIcon('lightbulb'),
  success:  loadIcon('check-circle'),
  danger:   loadIcon('circle-x'),
  failure:  loadIcon('x'),
  bug:      loadIcon('bug'),
  example:  loadIcon('star'),
  quote:    loadIcon('quote'),
}

// ── Obsidian 标注 (> [!type] Title) ─────────────
function rehypeCallout() {
  return (tree) => {
    function walk(node, idx, parent) {
      if (node.tagName === 'blockquote' && parent) {
        const p = node.children?.find(c => c.tagName === 'p')
        if (!p) return
        const text = p.children?.[0]
        if (text?.type !== 'text') return
        const m = text.value.match(/^\[!(\w+)\]/)
        if (!m) return

        const type = m[1].toLowerCase()
        node.properties = node.properties || {}
        node.properties['data-callout'] = type
        if (!node.properties.className) node.properties.className = []
        node.properties.className.push('callout')

        text.value = text.value.replace(/^\[!\w+\]\s*/, '')

        const brIdx = p.children.findIndex(c => c.tagName === 'br')
        if (brIdx >= 0) {
          const bodyChunks = p.children.slice(brIdx + 1)
          if (bodyChunks[0]?.type === 'text') {
            bodyChunks[0].value = bodyChunks[0].value.replace(/^注意\s*/, '')
          }

          p.properties = p.properties || {}
          if (!p.properties.className) p.properties.className = []
          p.properties.className.push('callout-title')

          const iconHtml = CALLOT_ICONS[type] || ''
          const titleText = p.children.slice(0, brIdx).filter(c => c.type === 'text').map(c => c.value).join('')
          p.children = iconHtml
            ? [{ type: 'raw', value: iconHtml }, { type: 'text', value: titleText.trim() }]
            : [{ type: 'text', value: titleText.trim() }]

          const bodyPara = { type: 'element', tagName: 'p', properties: {}, children: bodyChunks }
          const pIdx = node.children.indexOf(p)
          node.children.splice(pIdx + 1, 0, bodyPara)
        }
      }
      if (node.children) node.children.forEach((c, i) => walk(c, i, node))
    }
    walk(tree, null, null)
  }
}

// ── ==高亮== 语法 ────────────────────────────────
function remarkHighlight() {
  return (tree) => {
    const visit = (node) => {
      if (node.type === 'inlineCode') return
      if (node.children) {
        for (let i = node.children.length - 1; i >= 0; i--) {
          const child = node.children[i]
          if (child.type === 'text' && child.value.includes('==')) {
            const parts = child.value.split(/(==.+?==)/)
            const kids = parts.map(p => {
              const m = p.match(/^==(.+?)==$/)
              return m
                ? { type: 'markHighlight', data: { hName: 'mark' }, children: [{ type: 'text', value: m[1] }] }
                : { type: 'text', value: p }
            })
            node.children.splice(i, 1, ...kids)
          }
          visit(child)
        }
      }
    }
    visit(tree)
  }
}

// ── 图片语法 (![position](url) / ![position|width](url)) ──
function remarkImagePipe() {
  return (tree) => {
    const visit = (node) => {
      if (node.type === 'image') {
        let position = 'center'
        let width = ''
        const alt = node.alt || ''

        if (alt.includes('|')) {
          const [posPart, widthPart] = alt.split('|')
          const pos = posPart.trim()
          if (pos === 'left' || pos === 'right' || pos === 'center') position = pos
          if (/^\d+$/.test(widthPart.trim())) width = widthPart.trim()
          node.alt = ''
        } else if (alt === 'left' || alt === 'right' || alt === 'center') {
          position = alt
          node.alt = ''
        }

        node.data = node.data || {}
        node.data.hProperties = { class: `img-${position}`, style: '' }
        if (width) node.data.hProperties.width = width
      }
      if (node.children) node.children.forEach(visit)
    }
    visit(tree)
  }
}

// ── react:xxx 代码块处理 ──────────────────────────
function createInteractivePlugins() {
  const blocks = new Map()
  let counter = 0

  const remarkPlugin = () => (tree, file) => {
    const nodes = tree.children
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i]
      if (node.type !== 'code') continue
      const match = node.lang?.match(/^react:(\w+)$/)
      if (!match) continue

      const id = counter++
      blocks.set(id, { component: match[1], code: node.value })
      node.lang = `__interactive__${id}`

      if (!file.data.interactive) file.data.interactive = []
      file.data.interactive.push({ id, component: match[1], code: node.value })
    }
  }

  const rehypePlugin = () => (tree) => {
    const visit = (node) => {
      if (node.tagName === 'pre' && node.children?.[0]?.tagName === 'code') {
        const codeEl = node.children[0]
        const lang = codeEl.properties?.className?.[0]
        if (typeof lang !== 'string') return
        const match = lang.match(/^language-__interactive__(\d+)$/)
        if (!match) return

        const id = Number(match[1])
        const block = blocks.get(id)
        if (!block) return

        node.tagName = 'div'
        node.properties = {
          'data-interactive': block.component,
          'data-id': String(id),
          'data-code': JSON.stringify({ code: block.code }),
        }
        node.children = []
      }
      if (node.children) node.children.forEach(visit)
    }
    visit(tree)
  }

  return { remarkPlugin, rehypePlugin }
}

// ── 表格包裹（移动端横向滚动） ──────────────────────
function rehypeTableWrapper() {
  return (tree) => {
    function walk(node, idx, parent) {
      if (node.tagName === 'table' && parent && parent.tagName !== 'div') {
        parent.children[idx] = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-wrapper'] },
          children: [node],
        }
        return
      }
      if (node.children) node.children.forEach((c, i) => walk(c, i, node))
    }
    walk(tree, null, null)
  }
}

// ── 复制按钮（构建期注入） ─────────────────────────
function rehypeCopyButton() {
  return (tree) => {
    function walk(node, idx, parent) {
      if (node.tagName === 'pre' && parent) {
        parent.children[idx] = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['pre-wrapper'] },
          children: [
            node,
            { type: 'element', tagName: 'button', properties: { className: ['copy-btn'], 'data-action': 'copy' }, children: [{ type: 'text', value: '复制' }] },
          ],
        }
        return
      }
      if (node.children) node.children.forEach((c, i) => walk(c, i, node))
    }
    walk(tree, null, null)
  }
}

// ── 图片点击预览（FSLightbox） ─────────────────────
function rehypeImageLightbox(slug) {
  return tree => {
    if (!tree) return
    function walk(node, idx, parent) {
      if (!node?.type) return
      if (node.type === 'element' && node.tagName === 'img' && parent && parent.tagName !== 'a') {
        parent.children[idx] = {
          type: 'element',
          tagName: 'a',
          properties: {
            href: node.properties?.src || '',
            'data-action': 'preview',
            'data-fslightbox': slug,
          },
          children: [node],
        }
        return
      }
      if (node.children?.length) {
        for (let i = 0; i < node.children.length; i++) {
          walk(node.children[i], i, node)
        }
      }
    }
    walk(tree, null, null)
  }
}

// ── 图片懒加载（构建期末尾执行，lightbox 包裹之后） ──────
// 成功：src→占位 data URI、data-src→原图、width/height 按真实比例预留（防 CLS）、class 追加 lazy。
// 失败/非 http(s)/data URI：跳过该图（保持现状直接加载），console.warn。
// 注意：外层是非 async 工厂（返回 async transformer），unified 需同步拿到 transformer 函数
function rehypeImageLazy() {
  return async (tree) => {
    async function attachLazy(node) {
      const props = node.properties || {}
      const src = props.src
      const dims = await fetchImageDimensions(src)
      const pipeWidth = props.width ? Number(props.width) : null
      if (!dims) {
        console.warn(`[lazy] 跳过懒加载（尺寸解析失败）: ${src}`)
        return
      }
      // 比例换算：管道宽度存在则覆盖 width，height 按真实比例换算；否则用真实尺寸（CSS max-width 响应式缩放）
      let width, height
      if (pipeWidth) {
        width = pipeWidth
        height = Math.round(pipeWidth * dims.h / dims.w)
      } else {
        width = dims.w
        height = dims.h
      }
      props.src = PLACEHOLDER_URI
      props['data-src'] = src
      props.width = String(width)
      props.height = String(height)
      // 保留 img-* 定位类，追加 lazy
      let cls = props.className
      if (typeof cls === 'string') cls = cls.split(/\s+/)
      if (!Array.isArray(cls)) cls = []
      if (!cls.includes('lazy')) cls.push('lazy')
      props.className = cls
    }

    // 收集全部外链 img：已有 data-src / data URI / 非 http(s) 均跳过
    const imgs = []
    function collect(node) {
      if (!node?.type) return
      if (node.type === 'element' && node.tagName === 'img') {
        const props = node.properties || {}
        if (props.src && !props['data-src'] && /^https?:\/\//.test(props.src)) imgs.push(node)
      }
      if (node.children?.length) node.children.forEach(collect)
    }
    collect(tree)
    // 并行解析（单图 2KB，量小）
    await Promise.all(imgs.map(attachLazy))
  }
}

// ── 参考板块（## 参考 + 有序列表 → 两行式引用条目） ──
// 标题文本精确匹配「参考/参考资料/References」且下一元素兄弟是 ol 才命中；
// 靠 remarkBreaks 的 <br> 把两行式条目拆成 标题段 + ref-url 段
const REF_HEADINGS = new Set(['参考', '参考资料', 'References'])
const REF_ICON = loadIcon('link-2')

function addClass(el, name) {
  let cls = el.properties?.className
  if (typeof cls === 'string') cls = cls.split(/\s+/)
  if (!Array.isArray(cls)) cls = []
  if (!cls.includes(name)) cls.push(name)
  el.properties.className = cls
}

function collectText(node) {
  if (node.type === 'text') return node.value
  let s = ''
  if (node.children) for (const c of node.children) s += collectText(c)
  return s
}

function rehypeRefSection() {
  return (tree) => {
    const visit = (node, idx, parent) => {
      if (node.children) node.children.forEach((c, i) => visit(c, i, node))
      if ((node.tagName !== 'h2' && node.tagName !== 'h3') || !parent) return
      if (!REF_HEADINGS.has(collectText(node).trim())) return

      // 下一元素兄弟（跳过空白文本）
      let next = null
      for (let i = idx + 1; i < parent.children.length; i++) {
        const s = parent.children[i]
        if (s.type === 'text' && !s.value.trim()) continue
        next = s
        break
      }
      if (!next || next.tagName !== 'ol') return

      addClass(node, 'ref-heading')
      addClass(next, 'ref-list')
      node.children.unshift({ type: 'raw', value: REF_ICON })

      // 归一化：br 拆分成 标题段 + ref-url 段；多段落形式标记最后一个 p
      // 兼容两种形态：宽松列表 li[p[...]] 与 紧凑列表 li[内联...]（remark-rehype 不包 p）
      const makeP = (cls, children) => ({
        type: 'element', tagName: 'p',
        properties: cls ? { className: [cls] } : {},
        children,
      })
      for (const li of next.children) {
        if (li.tagName !== 'li') continue
        const pIdx = li.children.findIndex(c => c.tagName === 'p')
        if (pIdx >= 0) {
          const p = li.children[pIdx]
          const brIdx = p.children.findIndex(c => c.tagName === 'br')
          if (brIdx >= 0) {
            const before = p.children.slice(0, brIdx)
            const after = p.children.slice(brIdx + 1)
            if (before.length) {
              p.children = before
              li.children.splice(pIdx + 1, 0, makeP('ref-url', after))
            } else {
              p.children = after
              addClass(p, 'ref-url')
            }
          } else {
            const ps = li.children.filter(c => c.tagName === 'p')
            if (ps.length >= 2) addClass(ps[ps.length - 1], 'ref-url')
          }
        } else {
          const brIdx = li.children.findIndex(c => c.tagName === 'br')
          if (brIdx < 0) continue
          const before = li.children.slice(0, brIdx)
          const after = li.children.slice(brIdx + 1)
          li.children = []
          if (before.length) li.children.push(makeP(null, before))
          li.children.push(makeP('ref-url', after))
        }
      }

      // 参考列表内链接开新窗口
      const inject = (n) => {
        if (n.tagName === 'a') {
          n.properties.target = '_blank'
          n.properties.rel = 'noopener noreferrer'
        }
        if (n.children) n.children.forEach(inject)
      }
      inject(next)
    }
    visit(tree, null, null)
  }
}

// ── $$ 定界的 inlineMath 转展示公式（源码 position 判定，不碰代码块） ──
// hName 用 code（phrasing）而非 pre（flow）：pre 会被 remark-rehype 提升出段落，导致同行公式段落撕裂
function remarkInlineDisplayMath() {
  return (tree, file) => {
    const src = String(file.value)
    const visit = (node) => {
      if (node.children) node.children.forEach(visit)
      if (node.type !== 'inlineMath') return
      const start = node.position?.start?.offset
      if (typeof start !== 'number' || src[start] !== '$' || src[start + 1] !== '$') return
      node.type = 'math'
      node.meta = null
      node.data = {
        hName: 'code',
        hProperties: { className: ['language-math', 'math-display'] },
        hChildren: [{ type: 'text', value: node.value }],
      }
    }
    visit(tree)
  }
}

// ── 块引用（Obsidian block reference）：^id 标记 → 块元素 id ──
// 必须在 rehype 链末端（shiki/katex/copyButton 之后）执行：shiki 会重建 <pre>、
// katex 会整体替换公式元素（splice 换节点），先于它们打 id 必被丢弃。
// Obsidian "Copy link to block" 产物两种落盘形态都处理（id 字符集与 Obsidian 一致）：
//   1) 独立一行 `^id` → 挂上方最近的块（顶层的 pre-wrapper / katex-display / 列表 / 标题 / 段……）；
//      列表项内（loose）的标记段归该列表项。
//   2) 块末行尾 ` ^id` → 该块自身（段/标题/列表项……任意元素文本末尾，剥标记保留其余文本）。
const BLOCK_ID_RE = /^\^([A-Za-z0-9_-]+)$/
const BLOCK_ID_SUFFIX_RE = /\s\^([A-Za-z0-9_-]+)\s*$/

function attachRefId(node, id) {
  node.properties = node.properties || {}
  node.properties.id = id
}

function rehypeBlockRef(defs = []) {
  return (tree) => {
    const visit = (children, parent) => {
      for (let i = 0; i < children.length; i++) {
        const node = children[i]

        // 摊平嵌套 root（rehype-shiki 会把 pre 包进一个 root）：就地展开，恢复为普通兄弟，
        // 让「上方最近块」命中 div.pre-wrapper 而非跳过整个代码块
        if (node.type === 'root' && node.children) {
          children.splice(i, 1, ...node.children)
          i--
          continue
        }
        if (node.type !== 'element') continue

        // 独立标记行：唯一文本子节点即 `^id`
        if (node.tagName === 'p' && node.children.length === 1 && node.children[0].type === 'text') {
          const m = node.children[0].value.trim().match(BLOCK_ID_RE)
          if (m) {
            const id = m[1]
            let target = null
            if (parent && parent.tagName === 'li') {
              // 列表项内标记段：Obsidian 语义归该列表项
              target = parent
            } else {
              // 挂上方最近元素兄弟（无则下方；再无则归父容器）
              for (let j = i - 1; j >= 0; j--) {
                if (children[j].type === 'element') { target = children[j]; break }
              }
              if (!target) {
                for (let j = i + 1; j < children.length; j++) {
                  if (children[j].type === 'element') { target = children[j]; break }
                }
              }
              if (!target) target = parent
            }
            if (target && target.type === 'element') {
              attachRefId(target, id)
              defs.push(id)
            }
            // 无论是否挂载成功，标记段都不进入可见 HTML
            children.splice(i, 1)
            i--
            continue
          }
        }

        // 行尾附缀：最末文本节点带 ` ^id` → 剥离标记并挂自身（覆盖 p / li / h2-h6 等）
        const lastText = [...node.children].reverse().find(c => c.type === 'text')
        if (lastText) {
          const m = lastText.value.match(BLOCK_ID_SUFFIX_RE)
          if (m) {
            const idx = lastText.value.lastIndexOf(` ^${m[1]}`)
            lastText.value = lastText.value.slice(0, idx)
            attachRefId(node, m[1])
            defs.push(m[1])
          }
        }

        if (node.children) visit(node.children, node)
      }
    }
    visit(tree.children, null)
  }
}

// ── 块引用链接解析：wikiLink → { value, uri }（remark-obsidian-link 0.2.4 契约） ──
// 库回调实际签名：toLink({ value, alias }) => ({ value, uri, title? })；
// 旧写法 (slug, text) => ({ href, children }) 与之不符，[[...]] 从未生效。
function makeToLink(currentSlug, titles, refs) {
  return (wikiLink) => {
    const raw = (wikiLink.value || '').trim()
    const alias = wikiLink.alias
    const hashIdx = raw.indexOf('#')
    const slugPart = hashIdx >= 0 ? raw.slice(0, hashIdx) : raw
    const frag = hashIdx >= 0 ? raw.slice(hashIdx + 1) : ''

    // Obsidian 同文引用形态 [[^id]]：无页面段 → 指向当前文章
    if (!frag && raw.startsWith('^')) {
      const id = raw.slice(1)
      refs.push({ from: currentSlug, slug: currentSlug, id })
      return { uri: `/blog/${currentSlug}#${id}`, value: alias || titles.get(currentSlug) || currentSlug }
    }

    // 块引用：fragment 以 ^ 开头 → /blog/<slug>#<id>（剥 ^，元素 id 不带 ^）
    if (frag.startsWith('^')) {
      const id = frag.slice(1)
      refs.push({ from: currentSlug, slug: slugPart, id })
      return { uri: `/blog/${slugPart}#${id}`, value: alias || titles.get(slugPart) || slugPart }
    }

    // 普通互链：无 alias 显示目标文章标题；非 ^ 片段原样保留进 href（命中即得，不命中停页顶）
    return { uri: `/blog/${slugPart}${frag ? `#${frag}` : ''}`, value: alias || titles.get(slugPart) || slugPart }
  }
}

// ── Markdown 编译 ─────────────────────────────────
async function compileMD(source, slug = 'page', refs = [], defs = [], titles = new Map()) {
  const { remarkPlugin, rehypePlugin } = createInteractivePlugins()
  let interactive = []
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(remarkMath)
    .use(remarkInlineDisplayMath)
    .use(remarkObsidianLink, { toLink: makeToLink(slug, titles, refs) })
    .use(remarkPlugin)
    .use(remarkImagePipe)
    .use(remarkHighlight)
    .use(remarkRehype)
    .use(rehypeCallout)
    .use(rehypeRefSection)
    .use(rehypeRaw)
    .use(rehypeKatex, { strict: false })
    .use(rehypeShiki, {
      themes: { light: 'everforest-dark', dark: 'everforest-dark' },
      transformers: [{
        line(node, line) {
          node.properties['data-line'] = line
        }
      }],
    })
    .use(rehypePlugin)
    .use(rehypeTableWrapper)
    .use(rehypeCopyButton)
    .use(rehypeBlockRef, defs)
    .use(() => rehypeImageLightbox(slug))
    .use(rehypeImageLazy)
    .use(rehypeStringify)
    .process(source)

  if (file.data?.interactive) {
    interactive = file.data.interactive
  }
  return { html: String(file), interactive }
}

// ── 文章处理 ─────────────────────────────────────
async function buildPosts() {
  const postsDir = join(contentDir, 'posts')
  const outDir = join(contentDir, 'posts')
  const pagesDir = join(contentDir, 'pages')

  if (!existsSync(postsDir)) mkdirSync(postsDir, { recursive: true })
  if (!existsSync(pagesDir)) mkdirSync(pagesDir, { recursive: true })

  const files = readdirSync(postsDir).filter(f => f.endsWith('.md'))
  const posts = []

  // 预扫全部文章 frontmatter（含 draft）：块引用无 alias 时显示目标文章标题用
  const titles = new Map()
  for (const file of files) {
    const { data } = matter(readFileSync(join(postsDir, file), 'utf-8'))
    if (data.title) titles.set(basename(file, '.md'), data.title)
  }

  // 块引用收集：refs（引用清单，含来源）/ idDefs（每文定义的 ^id）
  const refs = []
  const idDefs = new Map()

  function parseDate(val) {
    if (val instanceof Date) {
      // gray-matter 解析 YAML 得到 Date（午夜 UTC），转回北京时间
      return new Date(val.getTime() - 8 * 3600 * 1000)
    }
    return /[\sT]/.test(val) ? new Date(val) : new Date(val + 'T00:00:00+08:00')
  }

  /**
   * 取文章 md 文件的最后 git 提交日期（更新时间来源）。
   * CI 拉取会重置文件 mtime，git 提交时间才可靠；无提交历史（新文件）→ null。
   * @param {string} file 文章路径
   * @returns {string | null} YYYY-MM-DD 或 null
   */
  function gitCommitDate(file) {
    const r = spawnSync('git', ['log', '-1', '--format=%cI', '--', file], { encoding: 'utf8' })
    const out = (r.stdout || '').trim()
    if (!out) return null
    // %cI 为 ISO 8601（含时区），归一为本地时区纯日期
    return new Date(out).toLocaleDateString('en-CA')
  }

  for (const file of files) {
    const raw = readFileSync(join(postsDir, file), 'utf-8')
    const { data, content } = matter(raw)
    const slug = basename(file, '.md')

    // 验证必需字段
    if (!data.title || !data.date || !data.description) {
      console.error(`[skip] ${file}: 缺少必需 frontmatter 字段（title/date/description）`)
      console.log(data)
      continue
    }

    // draft 过滤
    if (data.draft && !isDev) {
      console.log(`[skip] ${file}: draft`)
      continue
    }

    // 未来日期过滤（纯日期按北京时间，带时间则直接解析）
    if (parseDate(data.date) > new Date()) {
      console.log(`[skip] ${file}: 未来日期`)
      continue
    }

    const defs = []
    const { html, interactive } = await compileMD(content, slug, refs, defs, titles)
    idDefs.set(slug, defs)

    posts.push({
      slug,
      title: data.title,
      date: data.date,
      updated: gitCommitDate(join(postsDir, file)),
      description: data.description,
      category: data.category || null,
      tags: data.tags || [],
      series: data.series || null,
      seriesIndex: typeof data.seriesIndex === 'number' ? data.seriesIndex : null,
      draft: data.draft || false,
      cover: data.cover || null,
      interactive,
    })

    // 写入文章 HTML
    writeFileSync(join(outDir, `${slug}.html`), html)
    console.log(`[ok] ${file} → ${slug}.html`)
  }

  // 排序：date 降序，同日按 slug 编号倒序
  posts.sort((a, b) => {
    const d = new Date(b.date) - new Date(a.date)
    return d !== 0 ? d : b.slug.localeCompare(a.slug)
  })

  // 写入 posts.json（不包含 interactive 数据，按路由按需加载）
  const metaPosts = posts.map(({ interactive, ...rest }) => rest)
  writeFileSync(join(outDir, 'posts.json'), JSON.stringify(metaPosts, null, 2))
  console.log(`[ok] posts.json (${posts.length} 篇)`)

  // ── 块引用失效校验（警告不阻断：发布不应被历史引用卡死） ──
  let broken = 0
  for (const ref of refs) {
    if (!titles.has(ref.slug)) {
      console.warn(`[ref] ${ref.from}: 目标文章不存在: [[${ref.slug}#^${ref.id}]]`)
      broken++
    } else if (!idDefs.get(ref.slug)?.includes(ref.id)) {
      console.warn(`[ref] ${ref.from}: 目标块不存在（文章为草稿或无此 ^id）: [[${ref.slug}#^${ref.id}]]`)
      broken++
    }
  }
  const dupIds = []
  for (const [slug, defs] of idDefs) {
    const seen = new Set()
    for (const id of defs) {
      if (seen.has(id)) dupIds.push(`${slug}:^${id}`)
      seen.add(id)
    }
  }
  for (const d of dupIds) console.warn(`[ref] ${d}: 同页重复块 id`)
  if (broken || dupIds.length) {
    console.warn(`[ref] 块引用校验: ${broken} 条失效引用, ${dupIds.length} 处重复 id`)
  }

  // ── 静态页面 ──
  if (existsSync(pagesDir)) {
    const pageFiles = readdirSync(pagesDir).filter(f => f.endsWith('.md'))
    const pagesData = {}
    for (const file of pageFiles) {
      const raw = readFileSync(join(pagesDir, file), 'utf-8')
      const { content } = matter(raw)
      const { html } = await compileMD(content)
      const name = basename(file, '.md')
      writeFileSync(join(contentDir, 'pages', `${name}.html`), html)
      pagesData[name] = html
      console.log(`[ok] pages/${file} → ${name}.html`)
    }
    writeFileSync(join(contentDir, 'pages', 'pages.json'), JSON.stringify(pagesData, null, 2))
  }
}

buildPosts().catch(console.error)
