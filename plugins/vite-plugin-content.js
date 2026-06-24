import { execSync } from 'child_process'

export default function contentPlugin() {
  return {
    name: 'vite-plugin-content',
    configureServer(server) {
      server.watcher.add('content/**/*.md')

      // 启动时预生成搜索索引
      try {
        execSync('node scripts/build-search-index.js', { stdio: 'inherit' })
      } catch (_) {}

      function rebuild() {
        console.log('[content] rebuilding...')
        try {
          execSync('node scripts/build-posts.js --dev', { stdio: 'inherit' })
          execSync('node scripts/build-search-index.js', { stdio: 'inherit' })
          console.log('[content] rebuild done, reloading browser')
          server.ws.send({ type: 'full-reload' })
        } catch (e) {
          console.error('[content] build failed:', e.message)
        }
      }

      server.watcher.on('change', (path) => {
        if (path.endsWith('.md')) rebuild()
      })

      server.watcher.on('add', (path) => {
        if (path.endsWith('.md')) rebuild()
      })

      server.watcher.on('unlink', (path) => {
        if (path.endsWith('.md')) rebuild()
      })
    },
  }
}
