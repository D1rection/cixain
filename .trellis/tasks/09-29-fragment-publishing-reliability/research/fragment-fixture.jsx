import React from 'react'
import {createRoot} from 'react-dom/client'
import {Router} from 'wouter'
import {BlogDataContext} from './src/hooks/useBlogData.js'
import {ScrollProvider} from './src/components/ScrollContainer.jsx'
import FragmentPage from './src/pages/FragmentPage.jsx'
import './src/styles/global.css'
const fragments=['a','b','inline'].map(slug=>({slug,title:slug,date:'2026-01-01',...(slug==='inline'?{fragmentContent:'<p>内联正文</p>'}:{})}))
createRoot(document.getElementById('root')).render(<Router base={import.meta.env.BASE_URL.replace(/\/$/,'')}><ScrollProvider><BlogDataContext.Provider value={{fragments}}><FragmentPage/></BlogDataContext.Provider></ScrollProvider></Router>)
