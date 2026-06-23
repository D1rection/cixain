import { createContext, useContext } from 'react'

export const BlogDataContext = createContext({})

export function useBlogData() {
  return useContext(BlogDataContext)
}
