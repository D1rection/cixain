import { Link } from 'wouter'
import { useMemo } from 'react'
import styles from './PostEnd.module.css'

const LICENSE_URL = 'https://creativecommons.org/licenses/by-nc-sa/4.0/'

/**
 * 文章底部模块：终端窗口风格（上一篇/下一篇、相关推荐、版权）
 * @param {{ post: Object, posts: Object[] }} props
 */
export default function PostEnd({ post, posts }) {
  const idx = posts.findIndex(p => p.slug === post.slug)
  // idx < 0 时找不到文章（dev 回退路径），不渲染导航
  const next = idx > 0 ? posts[idx - 1] : null
  const prev = idx >= 0 && idx < posts.length - 1 ? posts[idx + 1] : null

  const related = useMemo(() => {
    const curTags = new Set(post.tags || [])
    if (curTags.size === 0) return []
    return posts
      .filter(p => p.slug !== post.slug)
      .map(p => ({ post: p, score: (p.tags || []).filter(t => curTags.has(t)).length }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score || new Date(b.post.date) - new Date(a.post.date))
      .slice(0, 3)
      .map(x => x.post)
  }, [post, posts])

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
