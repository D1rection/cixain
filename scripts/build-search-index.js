import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const distDir = join(rootDir, 'dist')
const publicDir = join(rootDir, 'public')
const contentDir = join(rootDir, 'content')

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function build() {
  const posts = JSON.parse(readFileSync(join(contentDir, 'posts', 'posts.json'), 'utf-8'))

  const index = posts.map(p => {
    const html = readFileSync(join(contentDir, 'posts', `${p.slug}.html`), 'utf-8')
    const text = stripHtml(html)
    return {
      slug: p.slug,
      title: p.title,
      description: p.description || '',
      category: p.category || '',
      date: p.date,
      text: text.slice(0, 2000),
    }
  })

  const data = JSON.stringify(index)

  // production: vite build takes from public/ → dist/
  // so only write to public/; the build pipeline already copies public/ to dist/
  mkdirSync(publicDir, { recursive: true })
  writeFileSync(join(publicDir, 'search-index.json'), data)
  // also write to dist/ for the existing build pipeline (build-seo.js runs after vite build)
  mkdirSync(distDir, { recursive: true })
  writeFileSync(join(distDir, 'search-index.json'), data)
  console.log(`[search] search-index.json (${index.length} posts)`)
}

build()
