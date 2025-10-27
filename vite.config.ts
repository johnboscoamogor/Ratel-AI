import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  root: 'functions/public',
  build: {
    // Output to a 'dist' folder at the project root, which Vercel will automatically serve.
    outDir: '../../dist',
    emptyOutDir: true,
  },
  plugins: [react()],
})
