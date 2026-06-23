import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs'
import { join, extname, basename } from 'path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeShiki from '@shikijs/rehype'

const isDev = process.argv.includes('--dev')

const __dirname = new URL('.', import.meta.url).pathname
const contentDir = join(__dirname, '..', 'content')

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

// ── Markdown 编译 ─────────────────────────────────
async function compileMD(source) {
  const { remarkPlugin, rehypePlugin } = createInteractivePlugins()
  let interactive = []
  const file = await unified()
    .use(remarkParse)
    .use(remarkPlugin)
    .use(remarkRehype)
    .use(rehypeShiki, { themes: { light: 'github-dark', dark: 'github-dark' } })
    .use(rehypePlugin)
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

    // 未来日期过滤
    if (new Date(data.date) > new Date()) {
      console.log(`[skip] ${file}: 未来日期`)
      continue
    }

    const { html, interactive } = await compileMD(content)

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

  // 排序：date 降序
  posts.sort((a, b) => new Date(b.date) - new Date(a.date))

  // 写入 posts.json（不包含 interactive 数据，按路由按需加载）
  const metaPosts = posts.map(({ interactive, ...rest }) => rest)
  writeFileSync(join(outDir, 'posts.json'), JSON.stringify(metaPosts, null, 2))
  console.log(`[ok] posts.json (${posts.length} 篇)`)

  // ── 静态页面 ──
  if (existsSync(pagesDir)) {
    const pageFiles = readdirSync(pagesDir).filter(f => f.endsWith('.md'))
    for (const file of pageFiles) {
      const raw = readFileSync(join(pagesDir, file), 'utf-8')
      const { content } = matter(raw)
      const { html } = await compileMD(content)
      const name = basename(file, '.md')
      writeFileSync(join(contentDir, 'pages', `${name}.html`), html)
      console.log(`[ok] pages/${file} → ${name}.html`)
    }
  }
}

buildPosts().catch(console.error)
