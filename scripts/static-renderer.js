import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const distDir = join(rootDir, 'dist')
const contentDir = join(rootDir, 'content')

async function build() {
  const posts = JSON.parse(readFileSync(join(contentDir, 'posts', 'posts.json'), 'utf-8'))
  const template = readFileSync(join(distDir, 'index.html'), 'utf-8')

  // wouter 是纯 ESM，ssrLoadModule 开箱即用
  const vite = await createServer({
    root: rootDir,
    server: { middlewareMode: true },
    appType: 'custom',
  })

  const { render } = await vite.ssrLoadModule('/src/entry-server.jsx')

  const routes = [
    { path: '/', output: 'index.html', data: { posts: posts.map(p => ({
      ...p,
      postContent: readFileSync(join(contentDir, 'posts', `${p.slug}.html`), 'utf-8'),
    })) } },
    ...posts.map(p => ({
      path: `/blog/${p.slug}`,
      output: join('blog', p.slug, 'index.html'),
      data: {
        post: p,
        postContent: readFileSync(join(contentDir, 'posts', `${p.slug}.html`), 'utf-8'),
      },
    })),
    {
      path: '/about',
      output: join('about', 'index.html'),
      data: {
        pageContent: existsSync(join(contentDir, 'pages', 'about.html'))
          ? readFileSync(join(contentDir, 'pages', 'about.html'), 'utf-8')
          : '',
      },
    },
    {
      path: '/404',
      output: '404.html',
      data: { posts: [] },
    },
  ]

  for (const route of routes) {
    const appHtml = render(route.path, route.data)
    const dataScript = `<script id="__BLOG_DATA__" type="application/json">${JSON.stringify(route.data)}</script>`

    const fullHtml = template
      .replace('<!--ssr-outlet-->', appHtml)
      .replace('</body>', `${dataScript}\n  </body>`)

    const outputPath = join(distDir, route.output)
    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, fullHtml)
    console.log(`[ssg] ${route.path} → ${route.output}`)
  }

  await vite.close()
}

build().catch(err => {
  console.error(err)
  process.exit(1)
})
