import { createContext, useContext } from 'react'

/** 博客页面数据上下文，构建时由 __BLOG_DATA__ 填充 */
export const BlogDataContext = createContext({})

/**
 * 读取当前页面的博客数据
 * @returns {{ posts?: Object[], post?: Object, postContent?: string, pageContent?: string }}
 */
export function useBlogData() {
  return useContext(BlogDataContext)
}
