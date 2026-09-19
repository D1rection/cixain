import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'
import { createHash } from 'crypto'
import matter from 'gray-matter'
import { compileMD } from './build-posts.js'
import { createRevisionDiff, REVISION_DIFF_VERSION } from './lib/revision-diff.js'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const contentDir = join(rootDir, 'content')
const postsDir = join(contentDir, 'posts')
const historyDir = join(rootDir, 'public', 'history')
const strict = process.env.REVISION_HISTORY_STRICT === '1' || process.env.CI === 'true'
const SCHEMA_VERSION = 1
const COMPILER_VERSION = `revision-${REVISION_DIFF_VERSION}`

function git(args, options = {}) {
  return execFileSync('git', args, { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options }).trim()
}

function bodyOf(source) {
  return matter(source).content.replace(/\r\n/g, '\n')
}

function hash(value) {
  return createHash('sha256').update(value).digest('hex')
}

function commitDate(commit) {
  return git(['show', '-s', '--format=%cI', commit])
}

function commitSubject(commit) {
  return git(['show', '-s', '--format=%s', commit])
}

function readAt(commit, relativePath) {
  try {
    return execFileSync('git', ['show', `${commit}:${relativePath}`], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch {
    return null
  }
}

function formatRevision(commit, date, summary) {
  return {
    id: commit,
    shortId: commit.slice(0, 7),
    committedAt: date,
    subject: summary,
  }
}

function currentMeta() {
  return JSON.parse(readFileSync(join(postsDir, 'posts.json'), 'utf8'))
}

function titlesFromCurrent(posts) {
  return new Map(posts.map(post => [post.slug, post.title]))
}

function historyForPost(post, titles) {
  const relativePath = `content/posts/${post.slug}.md`
  const workingPath = join(rootDir, relativePath)
  if (!existsSync(workingPath)) return null

  const workingSource = readFileSync(workingPath, 'utf8')
  const headSource = readAt('HEAD', relativePath)
  if (!headSource) return null

  const currentBody = bodyOf(workingSource)
  if (bodyOf(headSource) !== currentBody) {
    const message = `[history] ${post.slug}: 工作区正文未提交，跳过历史比较`
    if (strict) throw new Error(`${message}（严格构建要求正文与 HEAD 一致）`)
    console.warn(message)
    return null
  }

  let commits
  try {
    commits = git(['rev-list', '--first-parent', 'HEAD', '--', relativePath]).split('\n').filter(Boolean).reverse()
  } catch {
    if (strict) throw new Error('[history] 当前环境无法读取 Git 历史')
    console.warn(`[history] ${post.slug}: 无法读取 Git 历史，跳过`)
    return null
  }

  const snapshots = []
  let previousBodyHash = null
  for (const commit of commits) {
    const source = readAt(commit, relativePath)
    if (!source) continue
    const parsed = matter(source)
    if (parsed.data.draft) continue
    const body = bodyOf(source)
    const bodyHash = hash(body)
    if (bodyHash === previousBodyHash) continue
    previousBodyHash = bodyHash
    snapshots.push({
      ...formatRevision(commit, commitDate(commit), commitSubject(commit)),
      source,
      bodyHash,
    })
  }

  if (snapshots.length < 2) return null
  const currentSnapshot = snapshots[snapshots.length - 1]
  if (currentSnapshot.bodyHash !== hash(currentBody)) {
    if (strict) throw new Error(`[history] ${post.slug}: HEAD 历史快照与当前正文不一致`)
    console.warn(`[history] ${post.slug}: HEAD 历史快照与当前正文不一致，跳过`)
    return null
  }

  return { currentSnapshot, snapshots, currentHtml: readFileSync(join(postsDir, `${post.slug}.html`), 'utf8'), titles }
}

async function buildComparison(post, state, from) {
  const parsed = matter(from.source)
  const compiled = await compileMD(parsed.content, post.slug, [], [], state.titles)
  const diff = createRevisionDiff(compiled.html, state.currentHtml)
  const currentHeadings = [...state.currentHtml.matchAll(/<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi)]
    .map((match, index) => ({
      id: `revision-heading-${index + 1}`,
      text: match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
      level: Number(match[1]),
    }))
  return {
    schemaVersion: SCHEMA_VERSION,
    compilerVersion: COMPILER_VERSION,
    slug: post.slug,
    from: formatRevision(from.id, from.committedAt, from.subject),
    to: {
      ...formatRevision(state.currentSnapshot.id, state.currentSnapshot.committedAt, state.currentSnapshot.subject),
      bodyHash: state.currentSnapshot.bodyHash,
    },
    html: diff.html,
    toc: currentHeadings,
    changeCount: diff.changeCount,
  }
}

async function build() {
  let gitAvailable = true
  try {
    git(['rev-parse', '--is-inside-work-tree'])
  } catch {
    gitAvailable = false
  }
  if (!gitAvailable) {
    if (strict) throw new Error('[history] 生产构建需要完整 Git 仓库')
    console.warn('[history] 当前环境没有 Git，跳过历史版本生成')
    return
  }

  if (git(['rev-parse', '--is-shallow-repository']) === 'true') {
    if (strict) throw new Error('[history] 生产构建需要完整 Git 历史，当前 checkout 是浅克隆')
    console.warn('[history] 当前 checkout 是浅克隆，跳过历史版本生成')
    return
  }

  const posts = currentMeta()
  const titles = titlesFromCurrent(posts)
  if (existsSync(historyDir)) rmSync(historyDir, { recursive: true, force: true })
  mkdirSync(historyDir, { recursive: true })

  const updatedPosts = []
  let generated = 0
  for (const post of posts) {
    const state = historyForPost(post, titles)
    if (!state) {
      const { revisionHistory, ...rest } = post
      updatedPosts.push(rest)
      continue
    }

    const revisions = state.snapshots
      .slice(0, -1)
      .reverse()
      .map(snapshot => formatRevision(snapshot.id, snapshot.committedAt, snapshot.subject))
    const generation = hash(JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      compilerVersion: COMPILER_VERSION,
      slug: post.slug,
      currentBodyHash: state.currentSnapshot.bodyHash,
      revisions: state.snapshots.map(snapshot => [snapshot.id, snapshot.bodyHash]),
    })).slice(0, 16)
    const outputDir = join(historyDir, post.slug, generation)
    mkdirSync(outputDir, { recursive: true })

    for (const revision of state.snapshots.slice(0, -1)) {
      const comparison = await buildComparison(post, state, revision)
      comparison.generation = generation
      writeFileSync(join(outputDir, `${revision.id}.json`), JSON.stringify(comparison))
    }

    const index = {
      schemaVersion: SCHEMA_VERSION,
      compilerVersion: COMPILER_VERSION,
      slug: post.slug,
      generation,
      current: {
        id: state.currentSnapshot.id,
        bodyHash: state.currentSnapshot.bodyHash,
        committedAt: state.currentSnapshot.committedAt,
      },
      revisions,
    }
    writeFileSync(join(outputDir, 'index.json'), JSON.stringify(index, null, 2))
    updatedPosts.push({
      ...post,
      revisionHistory: {
        schemaVersion: SCHEMA_VERSION,
        generation,
        indexUrl: `/history/${post.slug}/${generation}/index.json`,
        olderCount: revisions.length,
        currentBodyHash: state.currentSnapshot.bodyHash,
        revisions: revisions.map(revision => ({
          ...revision,
          comparisonUrl: `/history/${post.slug}/${generation}/${revision.id}.json`,
        })),
      },
    })
    generated++
  }

  writeFileSync(join(postsDir, 'posts.json'), JSON.stringify(updatedPosts, null, 2))
  console.log(`[history] ${generated} 篇文章生成历史版本`)
}

build().catch(error => {
  console.error(error)
  process.exitCode = 1
})
