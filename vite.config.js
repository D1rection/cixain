import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import contentPlugin from './plugins/vite-plugin-content.js'

export default defineConfig({
  plugins: [react(), contentPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
