import test from 'node:test'
import assert from 'node:assert/strict'
import { createRevisionDiff, splitHtmlBlocks } from '../../scripts/lib/revision-diff.js'

test('splits nested compiled blocks without splitting inline tags', () => {
  const blocks = splitHtmlBlocks('<p>before <strong>text</strong></p>\n<div class="pre-wrapper"><pre><code>x</code></pre></div>')
  assert.equal(blocks.length, 2)
  assert.equal(blocks[0].kind, 'p')
  assert.equal(blocks[1].kind, 'div')
})

test('marks a small prose change inline', () => {
  const result = createRevisionDiff('<p>Hello world.</p>', '<p>Hello brave world.</p>')
  assert.equal(result.changeCount, 1)
  assert.deepEqual(result.changes, [{ id: 'revision-change-1', type: 'modified' }])
  assert.match(result.html, /revision-inline-block/)
  assert.match(result.html, /revision-added-text/)
  assert.match(result.html, /brave/)
  assert.doesNotMatch(result.html, /revision-block revision-removed/)
})

test('keeps whole block additions explicit', () => {
  const result = createRevisionDiff('<p>Keep this.</p>', '<p>Keep this.</p>\n<p>New paragraph.</p>')
  assert.equal(result.changeCount, 1)
  assert.match(result.html, /revision-block revision-added/)
  assert.match(result.html, /New paragraph\./)
})

test('does not execute or preserve copy buttons in structured blocks', () => {
  const before = '<div class="pre-wrapper"><pre><code>old</code></pre><button class="copy-btn" data-action="copy">复制</button></div>'
  const after = '<div class="pre-wrapper"><pre><code>new</code></pre><button class="copy-btn" data-action="copy">复制</button></div>'
  const result = createRevisionDiff(before, after)
  assert.match(result.html, /revision-block/)
  assert.doesNotMatch(result.html, /copy-btn/)
  assert.doesNotMatch(result.html, /data-action="copy"/)
})

test('renders interactive blocks as inert code in comparisons', () => {
  const encoded = '{&quot;code&quot;:&quot;const answer = 42&quot;}'
  const block = '<div data-interactive="FlashCard" data-id="1" data-code="' + encoded + '"></div>'
  const result = createRevisionDiff(block, block)
  assert.match(result.html, /revision-interactive-label/)
  assert.match(result.html, /const answer = 42/)
  assert.doesNotMatch(result.html, /data-interactive/)
})

test('marks removed headings so the current table of contents stays aligned', () => {
  const result = createRevisionDiff('<h2>Old section</h2>', '<h3>New heading</h3>')
  assert.match(result.html, /data-revision-state="removed"/)
  assert.match(result.html, /data-revision-state="added"/)
  assert.doesNotMatch(result.html, />>/)
})

test('keeps later anchors aligned after a long insertion', () => {
  const before = [
    '<h2>4. 点积、正交与投影</h2>',
    '<p>待续</p>',
    '<h2>5. 特征值与特征向量</h2>',
    '<p>待续</p>',
    '<h2>6. SVD 与伪逆</h2>',
    '<p>待续</p>',
    '<h2>参考</h2>',
    '<ol><li><p>资料 <a href="https://example.com">链接</a></p></li></ol>',
  ].join('')
  const after = [
    '<h2>4. 点积、正交与投影</h2>',
    '<p>待续</p>',
    '<p>新增的非方阵说明。</p>',
    '<p>新增的矩阵表示说明。</p>',
    '<p>新增的证明说明。</p>',
    '<h2>5. 点积、正交与投影</h2>',
    '<p>待续</p>',
    '<h2>6. 特征值与特征向量</h2>',
    '<p>待续</p>',
    '<h2>7. SVD 与伪逆</h2>',
    '<p>待续</p>',
    '<h2>参考</h2>',
    '<ol><li><p>资料 <a href="https://example.com">链接</a></p></li></ol>',
  ].join('')
  const result = createRevisionDiff(before, after)
  assert.equal((result.html.match(/>参考<\/h2>/g) || []).length, 1)
  assert.equal((result.html.match(/href="https:\/\/example.com"/g) || []).length, 1)
  assert.match(result.html, /新增的非方阵说明/)
  assert.ok(result.changes.length >= 1)
})

test('preserves KaTeX markup instead of flattening its visual and annotation text', () => {
  const before = '<p>结果是 <span class="katex"><math><semantics><mrow><mi>x</mi></mrow><annotation encoding="application/x-tex">x</annotation></semantics></math></span>。</p>'
  const after = '<p>结果是 <span class="katex"><math><semantics><mrow><mi>y</mi></mrow><annotation encoding="application/x-tex">y</annotation></semantics></math></span>。</p>'
  const result = createRevisionDiff(before, after)
  assert.equal(result.changeCount, 1)
  assert.equal((result.html.match(/class="katex"/g) || []).length, 2)
  assert.doesNotMatch(result.html, /revision-removed-text/)
  assert.doesNotMatch(result.html, /⟦formula/)
})

test('detects a link target change while retaining both link elements', () => {
  const result = createRevisionDiff(
    '<p>参阅 <a href="https://old.example">文档</a>。</p>',
    '<p>参阅 <a href="https://new.example">文档</a>。</p>',
  )
  assert.equal(result.changeCount, 1)
  assert.match(result.html, /href="https:\/\/old\.example"/)
  assert.match(result.html, /href="https:\/\/new\.example"/)
  assert.doesNotMatch(result.html, /revision-inline-block/)
})
