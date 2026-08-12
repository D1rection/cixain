import { Link } from 'wouter'
import { useMemo } from 'react'
import { sortSeries } from '../utils/series.js'
import styles from './PostEnd.module.css'

const LICENSE_URL = 'https://creativecommons.org/licenses/by-nc-sa/4.0/'

/**
 * 文章底部模块：终端窗口风格（系列导航/上一篇下一篇、相关推荐、版权）
 * 系列文章：prev/next 为系列内相邻篇（$ cd series），相关推荐排除同系列
 * @param {{ post: Object, posts: Object[] }} props
 */
export default function PostEnd({ post, posts }) {
  const idx = posts.findIndex(p => p.slug === post.slug)
  // idx < 0 时找不到文章（dev 回退路径），不渲染导航
  const seriesPosts = post.series ? sortSeries(posts, post.series) : []
  // 系列 ≥2 篇才触发系列导航；仅 1 篇时退化为全局导航（与非系列一致）
  const inSeries = seriesPosts.length > 1 && seriesPosts.some(p => p.slug === post.slug)
  const sIdx = inSeries ? seriesPosts.findIndex(p => p.slug === post.slug) : -1

  // 系列内为升序：上一节 = 排在当前之前，下一节 = 排在当前之后
  const next = inSeries
    ? (sIdx < seriesPosts.length - 1 ? seriesPosts[sIdx + 1] : null)
    : (idx > 0 ? posts[idx - 1] : null)
  const prev = inSeries
    ? (sIdx > 0 ? seriesPosts[sIdx - 1] : null)
    : (idx >= 0 && idx < posts.length - 1 ? posts[idx + 1] : null)

  const related = useMemo(() => {
    const curTags = new Set(post.tags || [])
    if (curTags.size === 0) return []
    return posts
      .filter(p => p.slug !== post.slug && !(inSeries && seriesPosts.includes(p)))
      .map(p => ({ post: p, score: (p.tags || []).filter(t => curTags.has(t)).length }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score || new Date(b.post.date) - new Date(a.post.date))
      .slice(0, 3)
      .map(x => x.post)
  }, [post, posts, seriesPosts, inSeries])

  return (
    <div className={styles.end}>
      <div className={styles.terminal}>
        <div className={styles.titleBar}>
          <span className={styles.dots}>
            <i className={styles.dotRed} />
            <i className={styles.dotYellow} />
            <i className={styles.dotGreen} />
          </span>
          <span className={styles.title}>cicada@blog:~</span>
        </div>

        <div className={styles.body}>
          {(prev || next) && (
            <div className={styles.group}>
              {inSeries ? (
                <>
                  <span className={styles.prompt}>$ cd series</span>
                  {prev && (
                    <Link href={`/blog/${prev.slug}`} className={styles.line}>
                      <span className={styles.out}>
                        <span className={styles.arrow}>→</span>
                        <span className={styles.dir}>上一节</span>
                        <span className={styles.outTitle}>{prev.title}</span>
                      </span>
                    </Link>
                  )}
                  {next && (
                    <Link href={`/blog/${next.slug}`} className={styles.line}>
                      <span className={styles.out}>
                        <span className={styles.arrow}>→</span>
                        <span className={styles.dir}>下一节</span>
                        <span className={styles.outTitle}>{next.title}</span>
                      </span>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  {prev && (
                    <Link href={`/blog/${prev.slug}`} className={styles.line}>
                      <span className={styles.prompt}>$ cat ../prev</span>
                      <span className={styles.out}>
                        <span className={styles.arrow}>→</span>
                        {prev.title}
                      </span>
                    </Link>
                  )}
                  {next && (
                    <Link href={`/blog/${next.slug}`} className={styles.line}>
                      <span className={styles.prompt}>$ cat ../next</span>
                      <span className={styles.out}>
                        <span className={styles.arrow}>→</span>
                        {next.title}
                      </span>
                    </Link>
                  )}
                </>
              )}
            </div>
          )}

          {related.length > 0 && (
            <div className={styles.group}>
              <span className={styles.prompt}>$ grep related</span>
              {related.map(p => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className={styles.line}>
                  <span className={styles.out}>
                    <span className={styles.arrow}>→</span>
                    <span className={styles.outTitle}>{p.title}</span>
                    <span className={styles.outDate}>
                      {new Date(p.date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className={styles.footer}>
            <p className={styles.footerLine}>
              本作品采用 <a href={LICENSE_URL} className={styles.license} target="_blank" rel="noopener">CC BY-NC-SA 4.0</a> 许可协议
            </p>
            <p className={styles.footerSub}>转载或引用请注明出处</p>
          </div>
        </div>
      </div>
    </div>
  )
}
