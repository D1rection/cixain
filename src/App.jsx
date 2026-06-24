import NavBar from './components/NavBar.jsx'
import BackToTop from './components/BackToTop.jsx'
import Layout from './components/Layout.jsx'
import { Switch, Route, useLocation } from 'wouter'
import useTheme from './hooks/useTheme.js'
import Home from './pages/Home.jsx'
import BlogPost from './pages/BlogPost.jsx'
import About from './pages/About.jsx'
import NotFound from './pages/NotFound.jsx'

/** 博客路由映射 */
export default function App() {
  const { theme, toggle } = useTheme()
  const [location] = useLocation()
  const isHome = location === '/' || location.startsWith('/?')

  return (
    <>
      <NavBar theme={theme} onToggle={toggle} />
      <BackToTop />
      <Layout sidebar={isHome}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/blog/:slug" component={BlogPost} />
          <Route path="/about" component={About} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </>
  )
}
