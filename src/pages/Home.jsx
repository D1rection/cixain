import { useSearchParams } from 'react-router-dom'

export default function Home() {
  const [searchParams] = useSearchParams()
  const tag = searchParams.get('tag')
  const category = searchParams.get('category')

  return (
    <main>
      <h1>cixain</h1>
      <p>
        {tag && `标签: ${tag}`}
        {category && `分类: ${category}`}
        {!tag && !category && '欢迎来到我的博客'}
      </p>
    </main>
  )
}
