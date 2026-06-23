import { useSearchParams } from 'react-router-dom'
import { useBlogData } from '../hooks/useBlogData.js'
import PostList from '../components/PostList.jsx'

export default function Home() {
  const { posts = [] } = useBlogData()
  const [searchParams] = useSearchParams()
  const tag = searchParams.get('tag')
  const category = searchParams.get('category')

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
