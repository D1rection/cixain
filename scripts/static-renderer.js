import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'fs'
import { join, dirname } from 'path'
import { execSync } from 'child_process'
import { fileURLToPath, pathToFileURL } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const distDir = join(rootDir, 'dist')
const serverDir = join(distDir, 'server')
const contentDir = join(rootDir, 'content')

async function build() {
  // 1. Build SSR bundle as CJS
  console.log('[ssg] building SSR bundle...')
  rmSync(serverDir, { recursive: true, force: true })
  const bin = join(rootDir, 'node_modules', '.bin', 'vite')
  execSync(
    `${bin} build --ssr src/entry-server.jsx --outDir dist/server --config vite.config.js`,
    { cwd: rootDir, stdio: 'pipe' },
  )

  // 2. Load SSR render function
  const { render } = await import(pathToFileURL(join(serverDir, 'entry-server.js')).href)

  // 3. Read data
  const posts = JSON.parse(readFileSync(join(contentDir, 'posts', 'posts.json'), 'utf-8'))
  const template = readFileSync(join(distDir, 'index.html'), 'utf-8')

  // 4. Define routes
  const routes = [
    { path: '/', output: 'index.html', data: { posts } },
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
      data: { posts },
    },
  ]

  // 5. Render each route
  for (const route of routes) {
    const appHtml = render(route.path, route.data)

    const dataScript = `<script id="__BLOG_DATA__" type="application/json">${JSON.stringify(route.data)}</script>`

    const fullHtml = template
      .replace('<!--ssr-outlet-->', appHtml)
      .replace('</body>', `${dataScript}\n  </body>`)

    const outputPath = join(distDir, route.output)
    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, fullHtml)

    // 为文章页额外产出 data.json（供 SPA 客户端导航按需加载）
    if (route.data.post) {
      const dataPath = join(distDir, 'blog', route.data.post.slug, 'data.json')
      writeFileSync(dataPath, JSON.stringify(route.data))
    }

    console.log(`[ssg] ${route.path} → ${route.output}`)
  }

  // 6. Clean up SSR bundle
  rmSync(serverDir, { recursive: true, force: true })
}

build().catch(err => {
  console.error(err)
  process.exit(1)
})
