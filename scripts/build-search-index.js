import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import remarkMath from 'remark-math'
import { remarkObsidianLink } from 'remark-obsidian-link'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import { slugifyHeading } from '../src/utils/headingSlug.js'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(rootDir, 'dist')
const publicDir = join(rootDir, 'public')
const contentDir = join(rootDir, 'content')
const SCHEMA_VERSION = 1
const SECTION_CHUNK_SIZE = 1200

function visibleText(node) {
  if (node.type === 'text') return node.value
  if (node.type !== 'element') return ''
  const tag = node.tagName
  if (['button', 'script', 'style', 'noscript', 'svg'].includes(tag)) return ''
  if (tag === 'img') return node.properties?.alt || ''
  if (tag === 'pre') {
    const code = node.children?.find(child => child.tagName === 'code')
    const classes = code?.properties?.className || []
    if (classes.some(name => typeof name === 'string' && name.startsWith('language-react:'))) return ''
  }
  const children = (node.children || []).map(visibleText).join(' ')
  return children
    .replace(/(?:^|\s)\^[A-Za-z0-9_-]+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitSection(section) {
  const text = section.text.replace(/\s+/g, ' ').trim()
  if (text.length <= SECTION_CHUNK_SIZE) return text ? [{ ...section, text }] : []
  const chunks = []
  let offset = 0
  while (offset < text.length) {
    let end = Math.min(text.length, offset + SECTION_CHUNK_SIZE)
    if (end < text.length) {
      const boundary = Math.max(
        text.lastIndexOf('。', end), text.lastIndexOf('；', end),
        text.lastIndexOf('. ', end), text.lastIndexOf('! ', end),
        text.lastIndexOf('? ', end), text.lastIndexOf(' ', end),
      )
      if (boundary > offset + SECTION_CHUNK_SIZE * 0.55) end = boundary + 1
    }
    if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1])) end--
    chunks.push({ ...section, heading: chunks.length ? '' : section.heading, text: text.slice(offset, end).trim() })
    offset = end
  }
  return chunks.filter(chunk => chunk.text)
}

function wikiLabel(wikiLink, current, registry) {
  const raw = (wikiLink.value || '').trim()
  const hash = raw.indexOf('#')
  let target = hash >= 0 ? raw.slice(0, hash) : raw
  let kind = 'post'
  if (raw.startsWith('^') || raw.startsWith('#')) {
    target = current.slug
    kind = current.kind
  } else if (target.startsWith('fragment/')) {
    target = target.slice('fragment/'.length)
    kind = 'fragment'
  } else if (target.startsWith('posts/')) {
    target = target.slice('posts/'.length)
  } else if (target.startsWith('post/')) {
    target = target.slice('post/'.length)
  }
  try { target = decodeURIComponent(target) } catch {}
  return wikiLink.alias || registry.get(`${kind}:${target}`)?.title || target || raw
}

function headingIdsFromHtml(html) {
  return [...html.matchAll(/<h[2-6]\b[^>]*\bid="([^"]+)"/gi)].map(match => match[1])
}

function hasSearchHeading(node) {
  if (node.type === 'element' && /^h[2-6]$/.test(node.tagName)) return true
  return node.children?.some(hasSearchHeading) || false
}

function isFoldBlockquote(node) {
  if (node.type !== 'element' || node.tagName !== 'blockquote') return false
  const firstParagraph = node.children?.find(child => child.tagName === 'p')
  return visibleText(firstParagraph || {}).trim().startsWith('[!fold]')
}

async function extractSections(source, currentItem, registry, headingIds) {
  const { content } = matter(source)
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(remarkMath)
    .use(remarkObsidianLink, { toLink: wikiLink => ({ value: wikiLabel(wikiLink, currentItem, registry), uri: '#' }) })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
  const tree = await processor.run(processor.parse(content))
  const sections = []
  let current = { anchor: null, heading: '', text: '' }
  let headingIndex = 0
  const flush = () => {
    sections.push(...splitSection(current))
    current = { anchor: null, heading: '', text: '' }
  }

  const appendText = text => {
    if (text) current.text = `${current.text}${current.text ? '\n' : ''}${text}`
  }
  const visit = node => {
    if (node.type === 'element' && /^h[2-6]$/.test(node.tagName)) {
      flush()
      const title = visibleText(node)
      current = { anchor: headingIds[headingIndex++] || slugifyHeading(title), heading: title, text: '' }
      return
    }
    if (isFoldBlockquote(node)) {
      appendText(visibleText(node).replace(/^\[!fold\]\s*/i, ''))
      return
    }
    if (hasSearchHeading(node)) {
      node.children?.forEach(visit)
      return
    }
    appendText(visibleText(node))
  }
  for (const node of tree.children || []) visit(node)
  flush()
  return sections
}

async function build() {
  const records = JSON.parse(readFileSync(join(contentDir, 'registry.json'), 'utf-8'))
  const registry = new Map(records.map(record => [record.id, record]))
  const documents = await Promise.all(records.map(async item => {
    const folder = item.kind === 'fragment' ? 'fragment' : 'posts'
    const source = readFileSync(join(contentDir, folder, `${item.slug}.md`), 'utf-8')
    const parsed = matter(source)
    const html = readFileSync(join(contentDir, folder, `${item.slug}.html`), 'utf-8')
    const sections = await extractSections(source, item, registry, headingIdsFromHtml(html))
    return {
      id: item.id,
      kind: item.kind,
      slug: item.slug,
      url: item.url,
      title: item.title,
      description: parsed.data.description || sections[0]?.text.slice(0, 180) || '',
      tags: item.tags || [],
      date: item.date,
      sections,
    }
  }))
  const data = JSON.stringify({ schemaVersion: SCHEMA_VERSION, documents })

  mkdirSync(publicDir, { recursive: true })
  writeFileSync(join(publicDir, 'search-index.json'), data)
  mkdirSync(distDir, { recursive: true })
  writeFileSync(join(distDir, 'search-index.json'), data)
  console.log(`[search] search-index.json (${documents.length} content records)`)
}

build().catch(error => {
  console.error('[search] failed to build index:', error)
  process.exitCode = 1
})
