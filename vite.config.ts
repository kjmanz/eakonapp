import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
 
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',  // 相対パスに変更
  server: {
    host: '0.0.0.0',  // 外部からアクセス可能にする
    port: 5173,       // ポート番号を明示的に指定
    open: true        // ブラウザを自動で開く
  }
}) 