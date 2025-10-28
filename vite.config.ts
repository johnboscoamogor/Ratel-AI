import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    // Output to a 'dist' folder at the project root.
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [react()],
})