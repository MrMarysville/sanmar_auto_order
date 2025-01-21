import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'import.meta.env.PRINTAVO_API_URL': JSON.stringify(env.PRINTAVO_API_URL),
      'import.meta.env.PRINTAVO_ACCESS_TOKEN': JSON.stringify(env.PRINTAVO_ACCESS_TOKEN),
      'import.meta.env.PRINTAVO_EMAIL': JSON.stringify(env.PRINTAVO_EMAIL),
    },
  }
})
