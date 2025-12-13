import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-warper-files',
      closeBundle() {
        // Copy warper files to dist
        copyFileSync('warper.html', 'dist/warper.html')
        copyFileSync('script.js', 'dist/script.js')
        copyFileSync('style.css', 'dist/style.css')
      }
    }
  ],
})
