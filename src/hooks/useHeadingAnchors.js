import { useMemo } from 'react'
import { slugifyHeading } from '../utils/headingSlug.js'
import { decodeHeadingEntities } from '../utils/headingText.js'

const HEADING_RE = /<h([2-6])(.*?)>(.*?)<\/h[2-6]>/gi
const TAG_RE = /<[^>]+>/g

/**
 * 从 HTML 中提取标题生成目录，并为标题添加 anchor ID
 * @param {string} html - 原始文章 HTML
 * @returns {{ processedHtml: string, toc: Array<{id: string, text: string, level: number}> }}
 */
export default function useHeadingAnchors(html) {
  return useMemo(() => {
    if (!html) return { processedHtml: '', toc: [] }

    const toc = []
    const idCount = {}

    const processedHtml = html.replace(HEADING_RE, (match, level, attrs, inner) => {
      const stripped = inner.replace(TAG_RE, '')
      const text = decodeHeadingEntities(stripped).trim()
      // 显示文字解码不能改变旧 HTML 的章节链接。
      const legacyText = stripped.trim()

      // 构建期块引用可能已给标题注入 id（如 ^demo-h）：复用该 id 并跳过 slug 生成，
      // 否则会出现重复 id 属性（HTML 首个 id 生效，TOC 用 slug 就滚不动）
      const existing = /id="([^"]+)"/.exec(attrs)
      let id = existing ? existing[1] : slugifyHeading(legacyText)
      if (!existing) {
        idCount[id] = (idCount[id] || 0) + 1
        if (idCount[id] > 1) id = `${id}-${idCount[id] - 1}`
      }

      toc.push({ id, text, level: Number(level) })
      const style = attrs.includes('style=') ? '' : ' style="scroll-margin-top: var(--heading-scroll-margin)"'
      return `<h${level}${attrs} id="${id}"${style}>${inner}</h${level}>`
    })

    return { processedHtml, toc }
  }, [html])
}
