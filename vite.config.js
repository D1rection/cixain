import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import contentPlugin from './plugins/vite-plugin-content.js'

export default defineConfig({
  base: process.env.VITE_BASE_URL || '/',
  plugins: [react(), contentPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
