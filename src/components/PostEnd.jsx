import { Link } from 'wouter'
import { useMemo, useRef, useState } from 'react'
import { sortSeries } from '../utils/series.js'
import { formatDate } from '../utils/date.js'
import styles from './PostEnd.module.css'

const LICENSE_URL = 'https://creativecommons.org/licenses/by-nc-sa/4.0/'

// 分享图标排：微信/小红书/知乎无公开 web 分享接口 → 复制链接；QQ 跳官方 intent
// 链接需绝对 URL，SSG 渲染期无 window，点击时才取 window.location.href
const SHARE_ICONS = [
  { id: 'wechat', label: '微信', color: '#07C160', type: 'copy', hint: '✓ 已复制，去微信粘贴' },
  {
    id: 'qq', label: 'QQ', color: '#1EBAFC', type: 'open',
    url: (u, t) => `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}`,
  },
  { id: 'xiaohongshu', label: '小红书', color: '#FF2442', type: 'copy', hint: '✓ 已复制，去小红书粘贴' },
  { id: 'zhihu', label: '知乎', color: '#0084FF', type: 'copy', hint: '✓ 已复制，去知乎粘贴' },
]

/**
 * 文章底部模块：终端窗口风格（系列导航/上一篇下一篇、相关推荐、分享、版权）
 * 系列文章：prev/next 为系列内相邻篇（$ cat series/prev|next），相关推荐排除同系列
 * @param {{ post: Object, posts: Object[] }} props
 */
export default function PostEnd({ post, posts }) {
  const [hint, setHint] = useState(null)
  const hintTimer = useRef(null)
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

  const handleCopy = (msg) => {
    navigator.clipboard.writeText(window.location.href)
    setHint(msg)
    clearTimeout(hintTimer.current)
    hintTimer.current = setTimeout(() => setHint(null), 2000)
  }

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
                  {prev && (
                    <Link href={`/blog/${prev.slug}`} className={styles.line}>
                      <span className={styles.prompt}>$ cat series/prev</span>
                      <span className={styles.out}>
                        <span className={styles.arrow}>→</span>
                        <span className={styles.outTitle}>{prev.title}</span>
                      </span>
                    </Link>
                  )}
                  {next && (
                    <Link href={`/blog/${next.slug}`} className={styles.line}>
                      <span className={styles.prompt}>$ cat series/next</span>
                      <span className={styles.out}>
                        <span className={styles.arrow}>→</span>
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
                      {formatDate(p.date, { pad: true })}
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

          <div className={styles.shareGroup}>
            <span className={styles.shareRow}>
              {SHARE_ICONS.map(b => (
                <button
                  key={b.id}
                  type="button"
                  className={styles.shareIcon}
                  style={{ color: b.color }}
                  title={b.label}
                  aria-label={`分享到${b.label}`}
                  onClick={() => (b.type === 'copy' ? handleCopy(b.hint) : window.open(b.url(window.location.href, post.title), '_blank', 'noopener'))}
                >
                  {b.id === 'wechat' && <WechatIcon />}
                  {b.id === 'qq' && <QQIcon />}
                  {b.id === 'xiaohongshu' && <XiaohongshuIcon />}
                  {b.id === 'zhihu' && <ZhihuIcon />}
                </button>
              ))}
            </span>
            {hint && <span className={styles.shareHint}>{hint}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

function WechatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
    </svg>
  )
}

function QQIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.395 15.035a40 40 0 0 0-.803-2.264l-1.079-2.695c.001-.032.014-.562.014-.836C19.526 4.632 17.351 0 12 0S4.474 4.632 4.474 9.241c0 .274.013.804.014.836l-1.08 2.695a39 39 0 0 0-.802 2.264c-1.021 3.283-.69 4.643-.438 4.673.54.065 2.103-2.472 2.103-2.472 0 1.469.756 3.387 2.394 4.771-.612.188-1.363.479-1.845.835-.434.32-.379.646-.301.778.343.578 5.883.369 7.482.189 1.6.18 7.14.389 7.483-.189.078-.132.132-.458-.301-.778-.483-.356-1.233-.646-1.846-.836 1.637-1.384 2.393-3.302 2.393-4.771 0 0 1.563 2.537 2.103 2.472.251-.03.581-1.39-.438-4.673" />
    </svg>
  )
}

function XiaohongshuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.405 9.879c.002.016.01.02.07.019h.725a.797.797 0 0 0 .78-.972.794.794 0 0 0-.884-.618.795.795 0 0 0-.692.794c0 .101-.002.666.001.777zm-11.509 4.808c-.203.001-1.353.004-1.685.003a2.528 2.528 0 0 1-.766-.126.025.025 0 0 0-.03.014L7.7 16.127a.025.025 0 0 0 .01.032c.111.06.336.124.495.124.66.01 1.32.002 1.981 0 .01 0 .02-.006.023-.015l.712-1.545a.025.025 0 0 0-.024-.036zM.477 9.91c-.071 0-.076.002-.076.01a.834.834 0 0 0-.01.08c-.027.397-.038.495-.234 3.06-.012.24-.034.389-.135.607-.026.057-.033.042.003.112.046.092.681 1.523.787 1.74.008.015.011.02.017.02.008 0 .033-.026.047-.044.147-.187.268-.391.371-.606.306-.635.44-1.325.486-1.706.014-.11.021-.22.03-.33l.204-2.616.022-.293c.003-.029 0-.033-.03-.034zm7.203 3.757a1.427 1.427 0 0 1-.135-.607c-.004-.084-.031-.39-.235-3.06a.443.443 0 0 0-.01-.082c-.004-.011-.052-.008-.076-.008h-1.48c-.03.001-.034.005-.03.034l.021.293c.076.982.153 1.964.233 2.946.05.4.186 1.085.487 1.706.103.215.223.419.37.606.015.018.037.051.048.049.02-.003.742-1.642.804-1.765.036-.07.03-.055.003-.112zm3.861-.913h-.872a.126.126 0 0 1-.116-.178l1.178-2.625a.025.025 0 0 0-.023-.035l-1.318-.003a.148.148 0 0 1-.135-.21l.876-1.954a.025.025 0 0 0-.023-.035h-1.56c-.01 0-.02.006-.024.015l-.926 2.068c-.085.169-.314.634-.399.938a.534.534 0 0 0-.02.191.46.46 0 0 0 .23.378.981.981 0 0 0 .46.119h.59c.041 0-.688 1.482-.834 1.972a.53.53 0 0 0-.023.172.465.465 0 0 0 .23.398c.15.092.342.12.475.12l1.66-.001c.01 0 .02-.006.023-.015l.575-1.28a.025.025 0 0 0-.024-.035zm-6.93-4.937H3.1a.032.032 0 0 0-.034.033c0 1.048-.01 2.795-.01 6.829 0 .288-.269.262-.28.262h-.74c-.04.001-.044.004-.04.047.001.037.465 1.064.555 1.263.01.02.03.033.051.033.157.003.767.009.938-.014.153-.02.3-.06.438-.132.3-.156.49-.419.595-.765.052-.172.075-.353.075-.533.002-2.33 0-4.66-.007-6.991a.032.032 0 0 0-.032-.032zm11.784 6.896c0-.014-.01-.021-.024-.022h-1.465c-.048-.001-.049-.002-.05-.049v-4.66c0-.072-.005-.07.07-.07h.863c.08 0 .075.004.075-.074V8.393c0-.082.006-.076-.08-.076h-3.5c-.064 0-.075-.006-.075.073v1.445c0 .083-.006.077.08.077h.854c.075 0 .07-.004.07.07v4.624c0 .095.008.084-.085.084-.37 0-1.11-.002-1.304 0-.048.001-.06.03-.06.03l-.697 1.519s-.014.025-.008.036c.006.01.013.008.058.008 1.748.003 3.495.002 5.243.002.03-.001.034-.006.035-.033v-1.539zm4.177-3.43c0 .013-.007.023-.02.024-.346.006-.692.004-1.037.004-.014-.002-.022-.01-.022-.024-.005-.434-.007-.869-.01-1.303 0-.072-.006-.071.07-.07l.733-.003c.041 0 .081.002.12.015.093.025.16.107.165.204.006.431.002 1.153.001 1.153zm2.67.244a1.953 1.953 0 0 0-.883-.222h-.18c-.04-.001-.04-.003-.042-.04V10.21c0-.132-.007-.263-.025-.394a1.823 1.823 0 0 0-.153-.53 1.533 1.533 0 0 0-.677-.71 2.167 2.167 0 0 0-1-.258c-.153-.003-.567 0-.72 0-.07 0-.068.004-.068-.065V7.76c0-.031-.01-.041-.046-.039H17.93s-.016 0-.023.007c-.006.006-.008.012-.008.023v.546c-.008.036-.057.015-.082.022h-.95c-.022.002-.028.008-.03.032v1.481c0 .09-.004.082.082.082h.913c.082 0 .072.128.072.128V11.19s.003.117-.06.117h-1.482c-.068 0-.06.082-.06.082v1.445s-.01.068.064.068h1.457c.082 0 .076-.006.076.079v3.225c0 .088-.007.081.082.081h1.43c.09 0 .082.007.082-.08v-3.27c0-.029.006-.035.033-.035l2.323-.003c.098 0 .191.02.28.061a.46.46 0 0 1 .274.407c.008.395.003.79.003 1.185 0 .259-.107.367-.33.367h-1.218c-.023.002-.029.008-.028.033.184.437.374.871.57 1.303a.045.045 0 0 0 .04.026c.17.005.34.002.51.003.15-.002.517.004.666-.01a2.03 2.03 0 0 0 .408-.075c.59-.18.975-.698.976-1.313v-1.981c0-.128-.01-.254-.034-.38 0 .078-.029-.641-.724-.998z" />
    </svg>
  )
}

function ZhihuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5.721 0C2.251 0 0 2.25 0 5.719V18.28C0 21.751 2.252 24 5.721 24h12.56C21.751 24 24 21.75 24 18.281V5.72C24 2.249 21.75 0 18.281 0zm1.964 4.078c-.271.73-.5 1.434-.68 2.11h4.587c.545-.006.445 1.168.445 1.171H9.384a58.104 58.104 0 01-.112 3.797h2.712c.388.023.393 1.251.393 1.266H9.183a9.223 9.223 0 01-.408 2.102l.757-.604c.452.456 1.512 1.712 1.906 2.177.473.681.063 2.081.063 2.081l-2.794-3.382c-.653 2.518-1.845 3.607-1.845 3.607-.523.468-1.58.82-2.64.516 2.218-1.73 3.44-3.917 3.667-6.497H4.491c0-.015.197-1.243.806-1.266h2.71c.024-.32.086-3.254.086-3.797H6.598c-.136.406-.158.447-.268.753-.594 1.095-1.603 1.122-1.907 1.155.906-1.821 1.416-3.6 1.591-4.064.425-1.124 1.671-1.125 1.671-1.125zM13.078 6h6.377v11.33h-2.573l-2.184 1.373-.401-1.373h-1.219zm1.313 1.219v8.86h.623l.263.937 1.455-.938h1.456v-8.86z" />
    </svg>
  )
}
