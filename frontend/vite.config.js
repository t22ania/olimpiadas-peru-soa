import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 'base' apunta al subdirectorio que usa GitHub Pages al publicar el sitio.
// En desarrollo local (npm run dev) se mantiene la raíz '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/olimpiadas-peru-soa/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  }
}))
