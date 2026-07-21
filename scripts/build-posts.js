import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs'
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

const isDev = process.argv.includes('--dev')

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

// ── Markdown 编译 ─────────────────────────────────
async function compileMD(source, slug = 'page') {
  // 行内 $$ 转展示公式（在 remark-math 解析前添加换行）
  source = source.replace(/\$\$(.+?)\$\$/gs, (match, c, offset, full) => {
    const lineStart = full.lastIndexOf('\n', offset) + 1
    const line = full.slice(lineStart, full.indexOf('\n', offset) >= 0 ? full.indexOf('\n', offset) : full.length)
    // 如果在 blockquote 行内，用空 > 行确保 $$ 独立段落
    if (line.trimStart().startsWith('>')) {
      return '\n>\n> $$\n> ' + c + '\n>\n> $$\n>'
    }
    return '\n$$\n' + c + '\n$$\n'
  })
  const { remarkPlugin, rehypePlugin } = createInteractivePlugins()
  let interactive = []
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(remarkMath)
    .use(remarkObsidianLink, { toLink: (slug, text) => ({ href: `/blog/${slug}`, children: [{ type: 'text', value: text || slug }] }) })
    .use(remarkPlugin)
    .use(remarkImagePipe)
    .use(remarkHighlight)
    .use(remarkRehype)
    .use(rehypeCallout)
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
    .use(() => rehypeImageLightbox(slug))
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

  function parseDate(str) {
    return /[\sT]/.test(str) ? new Date(str) : new Date(str + 'T00:00:00+08:00')
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

    const { html, interactive } = await compileMD(content, slug)

    posts.push({
      slug,
      title: data.title,
      date: data.date,
      description: data.description,
      category: data.category || null,
      tags: data.tags || [],
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
