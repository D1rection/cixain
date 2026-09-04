import { useState, useEffect, useCallback } from 'react'
import NavBar from './components/NavBar.jsx'
import BackToTop from './components/BackToTop.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import SearchOverlay from './components/SearchOverlay.jsx'
import ImagePreview from './components/ImagePreview.jsx'
import Layout from './components/Layout.jsx'
import Footer from './components/Footer.jsx'
import { Switch, Route, useLocation } from 'wouter'
import useTheme from './hooks/useTheme.js'
import { setPlaceholderTheme } from './utils/lazyImages.js'
import Home from './pages/Home.jsx'
import FilteredList from './pages/FilteredList.jsx'
import BlogPost from './pages/BlogPost.jsx'
import About from './pages/About.jsx'
import Archive from './pages/Archive.jsx'
import Browse from './pages/Browse.jsx'
import NotFound from './pages/NotFound.jsx'

/** 博客路由映射 */
export default function App() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [preview, setPreview] = useState(null)
  const { theme, mode: themeMode, toggle } = useTheme()
  const [location] = useLocation()
  const isHome = location === '/' || location.startsWith('/?')

  // 预览是当前页面的覆盖层：路由离开后立即卸载，避免移动端后退时遮罩残留
  const openPreview = useCallback(e => {
    setPreview({ ...e.detail, route: location })
  }, [location])

  const closePreview = useCallback(() => {
    setPreview(null)
  }, [])

  useEffect(() => {
    window.addEventListener('open-preview', openPreview)
    return () => window.removeEventListener('open-preview', openPreview)
  }, [openPreview])

  useEffect(() => {
    if (preview?.route && preview.route !== location) setPreview(null)
  }, [location, preview?.route])

  // 占位图配色跟随主题（含首帧水合后的修正；仅影响未加载的占位图）
  useEffect(() => {
    setPlaceholderTheme(theme)
  }, [theme])

  return (
    <>
      <ScrollToTop />
      <NavBar theme={theme} mode={themeMode} onToggle={toggle} onSearch={() => setSearchOpen(true)} />
      <BackToTop />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      {preview?.route === location && <ImagePreview {...preview} onClose={closePreview} />}
      <Layout sidebar={isHome}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/category/:slug" children={() => <FilteredList type="category" />} />
          <Route path="/tag/:slug" children={() => <FilteredList type="tag" />} />
          <Route path="/series/:slug" children={() => <FilteredList type="series" />} />
          <Route path="/blog/:slug">
            {params => <BlogPost key={params.slug} />}
          </Route>
          <Route path="/archive" component={Archive} />
          <Route path="/browse" component={Browse} />
          <Route path="/about" component={About} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
      <Footer />
    </>
  )
}
