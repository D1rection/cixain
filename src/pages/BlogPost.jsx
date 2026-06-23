import { useParams } from 'react-router-dom'

export default function BlogPost() {
  const { slug } = useParams()

  return (
    <main>
      <h1>文章: {slug}</h1>
    </main>
  )
}
