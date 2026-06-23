import { useSearchParams } from 'react-router-dom'
import PostList from '../components/PostList.jsx'
import posts from '../../content/posts/posts.json'

export default function Home() {
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
