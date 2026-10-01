import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, cp, symlink, writeFile, readFile, rm } from 'node:fs/promises'
import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test('history uses current anchor metadata, invalidates comparisons and fails closed without an index', async t => {
  const root = fileURLToPath(new URL('../..', import.meta.url))
  const directory = await mkdtemp(join(tmpdir(), 'cixain-history-headings-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  await cp(join(root, 'scripts'), join(directory, 'scripts'), { recursive: true })
  await cp(join(root, 'src/utils'), join(directory, 'src/utils'), { recursive: true })
  await symlink(join(root, 'node_modules'), join(directory, 'node_modules'))
  await writeFile(join(directory, 'package.json'), '{"type":"module"}')
  for (const dir of ['posts', 'fragment', 'pages']) await mkdir(join(directory, 'content', dir), { recursive: true })
  const source = body => `---\ntitle: article\ndate: 2020-01-01\ndescription: test\n---\n${body}`
  const put = (slug, body) => writeFile(join(directory, 'content/posts', `${slug}.md`), source(body))
  const git = (...args) => execFileSync('git', args, { cwd: directory, encoding: 'utf8', stdio: 'pipe' })
  const run = (script, strict = true) => spawnSync(process.execPath, [`scripts/${script}.js`], {
    cwd: directory, encoding: 'utf8', env: { ...process.env, CI: 'false', REVISION_HISTORY_STRICT: strict ? '1' : '0' },
  })
  const build = () => {
    const result = run('build-posts')
    assert.equal(result.status, 0, result.stderr)
  }
  const metadata = async () => JSON.parse(await readFile(join(directory, 'content/posts/posts.json'), 'utf8'))
  git('init', '--quiet')
  git('config', 'user.name', 'Heading Test')
  git('config', 'user.email', 'heading-test@example.invalid')
  await put('a', '## Old Heading\n\n[[#Current Heading]]\n\n[[#^local]]\n\n[[z#Target Heading]]\n\n[[z#Removed Heading]]')
  await put('z', '## Target Heading')
  git('add', 'content')
  git('commit', '--quiet', '-m', 'fixture old body')
  await put('a', '## Current Heading\n\nCurrent text ^local\n\n[[z#Target Heading]]')
  git('add', 'content')
  git('commit', '--quiet', '-m', 'fixture current body')
  build()
  const first = run('build-history')
  assert.equal(first.status, 0, first.stderr)
  assert.match(first.stderr, /history-link.*Removed Heading/)
  let article = (await metadata()).find(x => x.slug === 'a')
  const firstGeneration = article.revisionHistory.generation
  const comparison = JSON.parse(await readFile(join(directory, 'public', article.revisionHistory.revisions[0].comparisonUrl), 'utf8'))
  assert.match(comparison.compilerVersion, /headings-1/)
  assert.match(comparison.html, /href="\/blog\/a\/#current-heading"/)
  assert.match(comparison.html, /href="\/blog\/a\/#local"/)
  assert.match(comparison.html, /href="\/blog\/z\/#target-heading"/)
  assert(!/data-cixain/.test(comparison.html))

  await put('z', '## Target Heading ^changed')
  git('add', 'content')
  git('commit', '--quiet', '-m', 'fixture target ID changed')
  build()
  assert.equal(run('build-history').status, 0)
  article = (await metadata()).find(x => x.slug === 'a')
  assert.notEqual(article.revisionHistory.generation, firstGeneration)
  const updated = JSON.parse(await readFile(join(directory, 'public', article.revisionHistory.revisions[0].comparisonUrl), 'utf8'))
  assert.match(updated.html, /href="\/blog\/z\/#changed"/)

  await writeFile(join(directory, 'content/anchor-index.json'), '{"schemaVersion":99,"documents":{}}')
  assert.notEqual(run('build-history').status, 0)
  assert((await metadata()).find(x => x.slug === 'a').revisionHistory)
  await rm(join(directory, 'content/anchor-index.json'))
  const missing = run('build-history', false)
  assert.equal(missing.status, 0)
  assert.match(missing.stderr, /标题索引不可用/)
  assert(!(await metadata()).some(x => x.revisionHistory))
})
