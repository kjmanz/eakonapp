import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
 
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',  // 相対パスに変更
}) 