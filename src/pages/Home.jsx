import { useSearch } from 'wouter'
import { useBlogData } from '../hooks/useBlogData.js'
import PostList from '../components/PostList.jsx'

/** 首页：文章列表，支持 ?tag= / ?category= 筛选 */
export default function Home() {
  const { posts = [] } = useBlogData()
  const search = useSearch()
  const params = new URLSearchParams(search)
  const tag = params.get('tag')
  const category = params.get('category')

  const filtered = posts.filter(p => {
    if (tag && !p.tags.includes(tag)) return false
    if (category && p.category !== category) return false
    return true
  })

  return (
    <main>
      {tag && <h1>标签: {tag}</h1>}
      {category && <h1>分类: {category}</h1>}
      <PostList posts={filtered} />
    </main>
  )
}
