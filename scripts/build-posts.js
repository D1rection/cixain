import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs'
import { join, extname, basename, resolve } from 'path'
import { fileURLToPath } from 'url'
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
import { routePath } from '../src/utils/routes.js'
import { contentUrl } from '../src/utils/contentRoutes.js'
import { parseWikiTarget, wikiLinkLabel } from '../src/utils/contentLinks.js'
import { fragmentFrontmatter } from './lib/fragment-frontmatter.js'
import { validateContentReferences, reportContentDiagnostics } from './lib/content-validation.js'
import { slugifyHeading } from '../src/utils/headingSlug.js'

const __dirname = new URL('.', import.meta.url).pathname
const contentDir = join(__dirname, '..', 'content')

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
  overview: loadIcon('route'),
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

const FOLD_PRIMARY_HEADING_RE = /^(?:输入格式|输出格式|数据范围|提示|说明|约束|限制|进阶|样例\s*\d*|示例\s*\d*)[：:]?$/
const FOLD_SECONDARY_HEADING_RE = /^(?:输入|输出|解释)[：:]?$/

function nodeText(node) {
  if (node?.type === 'text') return node.value
  return node?.children?.map(nodeText).join('') || ''
}

function setFoldHeading(node, level, variant) {
  const label = nodeText(node).trim()
  node.tagName = 'div'
  node.properties = node.properties || {}
  const classes = Array.isArray(node.properties.className) ? node.properties.className : []
  node.properties.className = [...classes, 'fold-heading', `fold-heading-${variant}`]
  node.properties.role = 'heading'
  node.properties.ariaLevel = level
  if (label) node.properties.ariaLabel = label
}

// fold 内允许作者继续用正常 Markdown 标题表达结构，但页面产物不保留原生
// h1-h6，避免客户端 TOC 把题面小节当成文章章节。独立粗体标题仅对白名单兼容，
// 防止普通强调段落被误判为标题。无语言 fenced code 标为 text，让 Shiki 也为
// 题面输入输出应用博客统一的 Everforest 代码主题。
function normalizeFoldContent(details) {
  function walk(node) {
    if (node.type !== 'element') return

    if (node.tagName === 'pre') {
      const code = node.children?.find(child => child.type === 'element' && child.tagName === 'code')
      if (code) {
        code.properties = code.properties || {}
        const classes = Array.isArray(code.properties.className) ? code.properties.className : []
        if (!classes.some(name => typeof name === 'string' && name.startsWith('language-'))) {
          code.properties.className = [...classes, 'language-text']
        }
      }
    }

    const heading = /^h([1-6])$/.exec(node.tagName)
    if (heading) {
      const level = Number(heading[1])
      setFoldHeading(node, level, level <= 2 ? 'primary' : 'secondary')
    } else if (node.tagName === 'p') {
      const meaningful = (node.children || []).filter(child =>
        child.type !== 'text' || child.value.trim()
      )
      if (meaningful.length === 1 && meaningful[0].type === 'element' &&
          (meaningful[0].tagName === 'strong' || meaningful[0].tagName === 'b')) {
        const label = nodeText(meaningful[0]).trim()
        if (FOLD_PRIMARY_HEADING_RE.test(label)) setFoldHeading(node, 2, 'primary')
        if (FOLD_SECONDARY_HEADING_RE.test(label)) setFoldHeading(node, 3, 'secondary')
      }
    }

    node.children?.forEach(walk)
  }

  details.children?.forEach(walk)
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

        // 折叠块（> [!fold] 标题）：callout 转 <details>/<summary>，默认收起。
        // 写作侧与 Obsidian 完全一致（callout 就是 <details> 的 markdown 等价物），
        // 块内是正常 markdown（KaTeX/高亮/代码照常）。
        if (type === 'fold') {
          text.value = text.value.replace(/^\[!\w+\]\s*/, '')

          const brIdx = p.children.findIndex(c => c.tagName === 'br')
          const titleChunks = brIdx >= 0 ? p.children.slice(0, brIdx) : p.children
          const bodyChunks = brIdx >= 0 ? p.children.slice(brIdx + 1) : []
          const summaryText = nodeText({ children: titleChunks }).trim()
          const summaryChildren = summaryText
            ? titleChunks
            : [{ type: 'text', value: '题目描述' }]

          const details = {
            type: 'element',
            tagName: 'details',
            properties: { className: ['fold'] },
            children: [
              { type: 'element', tagName: 'summary', properties: {}, children: summaryChildren },
            ],
          }
          if (bodyChunks.length) {
            details.children.push({ type: 'element', tagName: 'p', properties: {}, children: bodyChunks })
          }
          details.children.push(...node.children.filter(c => c !== p))
          normalizeFoldContent(details)
          parent.children[idx] = details
          return
        }

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

// ── 图片语法 (![position](url) / ![position|width [height]](url)) ──
// 尺寸由作者在 markdown 显式声明（构建期零网络解析）；分隔符空格 / x / ×；
// 高可选——缺省时不写 height 属性 → 占位图固有 4:3 留盒（预设盒语义）。
function remarkImagePipe() {
  return (tree) => {
    const visit = (node) => {
      if (node.type === 'image') {
        let position = 'center'
        let width = ''
        let height = ''
        const alt = node.alt || ''

        if (alt.includes('|')) {
          const [posPart, widthPart] = alt.split('|')
          const pos = posPart.trim()
          if (pos === 'left' || pos === 'right' || pos === 'center') position = pos
          // widthPart = "w" 或 "w h"，分隔符空格/x/×；位置词可作首 token（![|left 300 200]）
          const parts = widthPart.trim().split(/\s+|x|×/i).filter(Boolean)
          if (position === 'center' && (parts[0] === 'left' || parts[0] === 'right' || parts[0] === 'center')) {
            position = parts.shift()
          }
          if (/^\d+$/.test(parts[0])) width = parts[0]
          if (parts.length > 1 && /^\d+$/.test(parts[1])) height = parts[1]
          node.alt = ''
        } else if (alt === 'left' || alt === 'right' || alt === 'center') {
          position = alt
          node.alt = ''
        }

        node.data = node.data || {}
        node.data.hProperties = { class: `img-${position}`, style: '' }
        if (width) node.data.hProperties.width = width
        if (height) node.data.hProperties.height = height
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

// ── 图片懒加载（构建期末尾执行，lightbox 包裹之后；纯同步、零网络） ──
// 尺寸不再构建期解析：width/height 由 remarkImagePipe 从 markdown 显式声明写入，
// 这里只做占位改造——src→占位 data URI、data-src→原图、class 追加 lazy，
// 并保留 remark 已写的 width/height（缺省高度 → 无 height 属性，4:3 预设盒）。
// 非 http(s) / data URI 跳过（本地资源直接加载）。
function rehypeImageLazy() {
  return (tree) => {
    const visit = (node) => {
      if (!node?.type) return
      if (node.type === 'element' && node.tagName === 'img') {
        const props = node.properties || {}
        const src = props.src
        if (!src || props['data-src'] || !/^https?:\/\//.test(src)) return
        props.src = PLACEHOLDER_URI
        props['data-src'] = src
        // 保留 img-* 定位类，追加 lazy
        let cls = props.className
        if (typeof cls === 'string') cls = cls.split(/\s+/)
        if (!Array.isArray(cls)) cls = []
        if (!cls.includes('lazy')) cls.push('lazy')
        props.className = cls
        return
      }
      if (node.children?.length) node.children.forEach(visit)
    }
    visit(tree)
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

function rehypeHeadingAnchors() {
  return tree => {
    const counts = new Map()
    const visit = node => {
      if (node.type === 'element' && /^h[2-6]$/.test(node.tagName) && !node.properties?.id) {
        // useHeadingAnchors reads serialized HTML before stripping tags, so preserve
        // escaped text entities here to keep existing heading URLs deterministic.
        const title = collectText(node).trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        const base = slugifyHeading(title)
        const count = counts.get(base) || 0
        counts.set(base, count + 1)
        node.properties = node.properties || {}
        node.properties.id = count ? `${base}-${count}` : base
      }
      node.children?.forEach(visit)
    }
    visit(tree)
  }
}

// ── 块引用链接解析：wikiLink → { value, uri }（remark-obsidian-link 0.2.4 契约） ──
// 库回调实际签名：toLink({ value, alias }) => ({ value, uri, title? })；
// 旧写法 (slug, text) => ({ href, children }) 与之不符，[[...]] 从未生效。
function makeToLink(current, registry) {
  return wikiLink => {
    const target = parseWikiTarget(wikiLink.value, current)
    const uri = target.error ? '#' : target.sameDocument ? `#${encodeURIComponent(target.anchor)}`
      : `${contentUrl(target.kind, target.slug)}${target.anchor ? `#${encodeURIComponent(target.anchor)}` : ''}`
    return { uri, value: wikiLinkLabel(wikiLink, current, registry) }
  }
}

/** Collect original wiki locations before remark-obsidian-link replaces the nodes. */
function collectWikiRefs(refs, current, lineOffset) {
  return tree => {
    const visit = node => {
      if (node.type === 'wikiLink') {
        const target = parseWikiTarget(node.value, current)
        const position = node.position?.start
        refs.push({ ...target, fromId: `${current.kind}:${current.slug}`, raw: `[[${node.value}]]`,
          position: position ? { line: position.line + lineOffset, column: position.column } : null })
      }
      node.children?.forEach(visit)
    }
    visit(tree)
  }
}

/** Inspect final anchors and all internal content links, including missing Markdown targets. */
function rehypeCollectContentLinks(refs, current, anchors, lineOffset) {
  const fromId = `${current.kind}:${current.slug}`
  const siteOrigin = new URL(process.env.SITE_URL || 'https://blog.cicadae.cloud').origin
  const base = (process.env.VITE_BASE_URL || '').replace(/\/$/, '')
  return tree => {
    const visit = node => {
      if (node.properties?.id) anchors.push(String(node.properties.id))
      if (node.tagName === 'a' && typeof node.properties?.href === 'string') {
        const raw = node.properties.href
        let target
        try {
          const parsed = new URL(raw, `${siteOrigin}${contentUrl(current.kind, current.slug)}`)
          if (raw.startsWith('#')) target = parseWikiTarget(raw, current)
          else if (parsed.origin === siteOrigin) {
            const path = base && parsed.pathname.startsWith(`${base}/`) ? parsed.pathname.slice(base.length) : parsed.pathname
            const match = path.match(/^\/(blog|fragment)\/([^/]+)\/?$/)
            if (match) target = parseWikiTarget(`${match[1] === 'blog' ? 'posts' : 'fragment'}/${match[2]}${parsed.hash}`, current)
          }
        } catch { /* External or malformed non-content URLs are outside this validator. */ }
        if (target && !refs.some(ref => ref.fromId === fromId && ref.targetId === target.targetId
          && ref.anchor === target.anchor && !ref.error)) {
          const position = node.position?.start
          refs.push({ ...target, fromId, raw,
            position: position ? { line: position.line + lineOffset, column: position.column } : null })
        }
      }
      node.children?.forEach(visit)
    }
    visit(tree)
  }
}

export async function compileMD(source, slug = 'page', refs = [], defs = [], titles = new Map(), options = {}) {
  const { remarkPlugin, rehypePlugin } = createInteractivePlugins()
  const contentKind = options.kind || 'post'
  const current = { kind: contentKind, slug }
  const anchors = []
  let interactive = []
  // 清理作者误带入 Markdown/公式的零宽空格，避免 KaTeX 在构建历史版本时
  // 将其当作未知字符并输出字体度量警告。
  const normalizedSource = String(source).replace(/\u200B/g, '')
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(remarkMath)
    .use(remarkInlineDisplayMath)
    .use(() => collectWikiRefs(refs, current, options.lineOffset || 0))
    .use(remarkObsidianLink, { toLink: makeToLink(current, options.registry || new Map()) })
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
    .use(rehypeHeadingAnchors)
    .use(() => rehypeCollectContentLinks(refs, current, anchors, options.lineOffset || 0))
    .use(() => rehypeImageLightbox(slug))
    .use(rehypeImageLazy)
    .use(rehypeStringify)
    .process(normalizedSource)

  if (file.data?.interactive) {
    interactive = file.data.interactive
  }
  return { html: String(file), interactive, anchors }
}

// ── 文章处理 ─────────────────────────────────────
export async function buildPosts({ dev: isDev = false, directory = contentDir } = {}) {
  const contentDir = directory
  const outputs = new Map()
  const allContent = new Map()
  const anchorDefs = new Map()
  const postsDir = join(contentDir, 'posts')
  const outDir = join(contentDir, 'posts')
  const fragmentsDir = join(contentDir, 'fragment')
  const pagesDir = join(contentDir, 'pages')

  if (!existsSync(postsDir)) mkdirSync(postsDir, { recursive: true })
  if (!existsSync(fragmentsDir)) mkdirSync(fragmentsDir, { recursive: true })
  if (!existsSync(pagesDir)) mkdirSync(pagesDir, { recursive: true })

  const files = readdirSync(postsDir).filter(f => f.endsWith('.md'))
  const fragmentFiles = readdirSync(fragmentsDir).filter(f => f.endsWith('.md'))
  const posts = []
  const fragments = []

  function contentSlug(file) {
    const slug = basename(file, '.md')
    if (!slug || slug === '.' || slug === '..' || /[\\/\u0000-\u001f]/.test(slug)) {
      throw new Error(`[error] 非法内容文件名: ${file}`)
    }
    return slug
  }

  // 预扫本次可见内容，供跨类型双链解析和无 alias 标题显示。
  const titles = new Map()
  const registry = new Map()
  const fragmentSources = []
  const sourceById = new Map()
  for (const file of files) {
    const { data } = matter(readFileSync(join(postsDir, file), 'utf-8'))
    const slug = contentSlug(file)
    const state = data.draft && !isDev ? 'draft' : parseDate(data.date) > new Date() ? 'future' : !data.title || !data.date || !data.description ? 'incomplete' : 'visible'
    allContent.set(`post:${slug}`, { file: `content/posts/${file}`, state })
    if (state !== 'visible') continue
    titles.set(slug, data.title)
    const id = `post:${slug}`
    registry.set(id, { id, kind: 'post', slug, title: data.title, url: contentUrl('post', slug) })
  }
  for (const file of fragmentFiles) {
    const parsed = matter(readFileSync(join(fragmentsDir, file), 'utf-8'))
    const slug = contentSlug(file)
    const sourceFile = `content/fragment/${file}`
    let normalized
    try {
      normalized = fragmentFrontmatter(parsed.data, { file: sourceFile, dev: isDev, matter: parsed.matter })
    } catch (error) {
      if (!isDev) throw error
      console.warn(`[frontmatter] ${error.message}`)
      allContent.set(`fragment:${slug}`, { file: sourceFile, state: 'invalid' })
      continue
    }
    const { data, state } = normalized
    const id = `fragment:${slug}`
    allContent.set(id, { file: sourceFile, state })
    if (state !== 'visible') {
      if (state === 'incomplete-draft') console.warn(`[draft] ${sourceFile}: 草稿需填写 title 和 date 才能预览`)
      continue
    }
    const source = { file, slug, data, content: parsed.content, lineOffset: parsed.orig.toString().slice(0, parsed.orig.toString().length - parsed.content.length).split('\n').length - 1 }
    fragmentSources.push(source)
    registry.set(id, { id, kind: 'fragment', slug, title: data.title, url: contentUrl('fragment', slug) })
    sourceById.set(id, source)
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
   * 归一 frontmatter updated → 北京时间纯日期 YYYY-MM-DD。
   * 来源为 Obsidian 插件写入（date 字段同语义）；无则 null。
   * 固定 +08:00 计算，避免 CI（UTC 时区）与本地时区差导致日期偏移一天。
   * @param {string | Date} val
   * @returns {string}
   */
  function normalizeDate(val) {
    const d = parseDate(val)
    return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10)
  }

  for (const file of files) {
    const raw = readFileSync(join(postsDir, file), 'utf-8')
    const { data, content } = matter(raw)
    const slug = contentSlug(file)

    if (data.showOnHome !== undefined && typeof data.showOnHome !== 'boolean') {
      throw new Error(`[error] ${file}: frontmatter 字段 showOnHome 必须是布尔值 true 或 false`)
    }

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
    const { html, interactive, anchors } = await compileMD(content, slug, refs, defs, titles, { kind: 'post', registry, lineOffset: raw.slice(0, raw.length - content.length).split('\n').length - 1 })
    const id = `post:${slug}`
    idDefs.set(id, defs)
    anchorDefs.set(id, anchors)
    sourceById.set(id, { file, slug, data, content })

    posts.push({
      id,
      kind: 'post',
      slug,
      contentUrl: contentUrl('post', slug),
      title: data.title,
      date: data.date,
      updated: data.updated ? normalizeDate(data.updated) : null,
      description: data.description,
      category: data.category || null,
      showOnHome: data.showOnHome ?? true,
      tags: data.tags || [],
      series: data.series || null,
      seriesIndex: typeof data.seriesIndex === 'number' ? data.seriesIndex : null,
      draft: data.draft || false,
      cover: data.cover || null,
      source: data.source || null,
      difficulty: data.difficulty || null,
      url: data.url || null,
      interactive,
      backlinks: [],
    })

    // 写入文章 HTML
    outputs.set(join(outDir, `${slug}.html`), html)
    console.log(`[ok] ${file} → ${slug}.html`)
  }

  // 排序：date 降序，同日按 slug 编号倒序
  posts.sort((a, b) => {
    const d = new Date(b.date) - new Date(a.date)
    return d !== 0 ? d : b.slug.localeCompare(a.slug)
  })

  for (const { file, slug, data, content, lineOffset } of fragmentSources) {
    const defs = []
    const { html, interactive, anchors } = await compileMD(content, slug, refs, defs, titles, { kind: 'fragment', registry, lineOffset })
    const id = `fragment:${slug}`
    idDefs.set(id, defs)
    anchorDefs.set(id, anchors)
    const description = data.description || String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180)
    fragments.push({
      id,
      kind: 'fragment',
      slug,
      url: contentUrl('fragment', slug),
      title: data.title,
      date: data.date,
      updated: data.updated,
      description,
      tags: Array.isArray(data.tags) ? data.tags : [],
      draft: data.draft || false,
      interactive,
      backlinks: [],
    })
    outputs.set(join(fragmentsDir, `${slug}.html`), html)
    console.log(`[ok] ${file} → ${slug}.html`)
  }
  fragments.sort((a, b) => new Date(b.updated || b.date) - new Date(a.updated || a.date) || a.slug.localeCompare(b.slug))

  // Compile pages before validating, so their content links and local anchors participate too.
  const pagesData = {}
  for (const file of readdirSync(pagesDir).filter(file => file.endsWith('.md'))) {
    const parsed = matter(readFileSync(join(pagesDir, file), 'utf-8'))
    const name = basename(file, '.md')
    const id = `page:${name}`
    allContent.set(id, { file: `content/pages/${file}`, state: 'visible' })
    registry.set(id, { id, kind: 'page', slug: name, url: routePath(`/${name}`) })
    const defs = []
    const { html, anchors } = await compileMD(parsed.content, name, refs, defs, titles, {
      kind: 'page', registry, lineOffset: parsed.orig.toString().slice(0, parsed.orig.toString().length - parsed.content.length).split('\n').length - 1,
    })
    idDefs.set(id, defs)
    anchorDefs.set(id, anchors)
    outputs.set(join(pagesDir, `${name}.html`), html)
    pagesData[name] = html
  }
  const diagnostics = validateContentReferences(refs, registry, allContent, anchorDefs, idDefs)
  reportContentDiagnostics(diagnostics, isDev)

  const inbound = new Map()
  const seenEdges = new Set()
  for (const ref of refs) {
    if (!registry.has(ref.targetId) || ref.fromId === ref.targetId) continue
    const edge = `${ref.fromId}\0${ref.targetId}`
    if (seenEdges.has(edge)) continue
    seenEdges.add(edge)
    const source = sourceById.get(ref.fromId)
    if (!source) continue
    const sourceKind = ref.fromId.startsWith('fragment:') ? 'fragment' : 'post'
    const target = inbound.get(ref.targetId) || []
    target.push({ id: ref.fromId, kind: sourceKind, slug: source.slug, title: source.data.title, url: contentUrl(sourceKind, source.slug) })
    inbound.set(ref.targetId, target)
  }
  for (const record of [...posts, ...fragments]) record.backlinks = inbound.get(record.id) || []

  // 写入 posts.json（不包含 interactive 数据，按路由按需加载）
  const metaPosts = posts.map(({ interactive, ...rest }) => rest)
  outputs.set(join(outDir, 'posts.json'), JSON.stringify(metaPosts, null, 2))
  const metaFragments = fragments.map(({ interactive, ...rest }) => rest)
  outputs.set(join(fragmentsDir, 'fragments.json'), JSON.stringify(metaFragments, null, 2))
  const searchRecords = [...metaPosts, ...metaFragments].map(record => ({
    ...record,
    url: record.contentUrl || record.url,
  }))
  outputs.set(join(contentDir, 'registry.json'), JSON.stringify(searchRecords, null, 2))
  console.log(`[ok] posts.json (${posts.length} 篇)`)
  console.log(`[ok] fragments.json (${fragments.length} 条)`)

  outputs.set(join(pagesDir, 'pages.json'), JSON.stringify(pagesData, null, 2))
  for (const [path, value] of outputs) writeFileSync(path, value)
  return { posts: metaPosts, fragments: metaFragments, diagnostics }

}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  buildPosts({ dev: process.argv.includes('--dev') }).catch(err => {
    console.error(err)
    process.exitCode = 1
  })
}
