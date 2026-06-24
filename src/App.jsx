import NavBar from './components/NavBar.jsx'
import { Switch, Route } from 'wouter'
import useTheme from './hooks/useTheme.js'
import Home from './pages/Home.jsx'
import BlogPost from './pages/BlogPost.jsx'
import About from './pages/About.jsx'
import NotFound from './pages/NotFound.jsx'

/** 博客路由映射 */
export default function App() {
  const { theme, toggle } = useTheme()

  return (
    <>
      <NavBar theme={theme} onToggle={toggle} />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route path="/about" component={About} />
        <Route component={NotFound} />
      </Switch>
    </>
  )
}
