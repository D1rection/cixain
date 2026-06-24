import { useSearch } from 'wouter'
import { useBlogData } from '../hooks/useBlogData.js'
import PostList from '../components/PostList.jsx'
import Pagination from '../components/Pagination.jsx'
import { PAGE_SIZE } from '../config.js'

/** 首页：文章列表 + 分页 */
export default function Home() {
  const { posts = [] } = useBlogData()
  const search = useSearch()
  const params = new URLSearchParams(search)
  const tag = params.get('tag')
  const category = params.get('category')
  const page = Math.max(1, parseInt(params.get('page') || '1', 10))

  const filtered = posts.filter(p => {
    if (tag && !p.tags.includes(tag)) return false
    if (category && p.category !== category) return false
    return true
  })

  const total = filtered.length
  const start = (page - 1) * PAGE_SIZE
  const paged = filtered.slice(start, start + PAGE_SIZE)

  return (
    <main>
      {tag && <h1>标签: {tag}</h1>}
      {category && <h1>分类: {category}</h1>}
      <PostList posts={paged} />
      <Pagination total={total} page={page} />
    </main>
  )
}
