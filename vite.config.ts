import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Define the self-contained SVG icon as a data URI.
// This prevents 404 errors for missing icon files.
const iconDataUri = "data:image/svg+xml,%3csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3e%3ctitle%3eRatel AI Logo%3c/title%3e%3cdefs%3e%3cmask id='ratel-logo-mask'%3e%3crect x='0' y='0' width='100' height='100' fill='white'/%3e%3ccircle cx='42' cy='50' r='45' fill='black'/%3e%3ccircle cx='42' cy='50' r='38' fill='white'/%3e%3ccircle cx='42' cy='50' r='31' fill='black'/%3e%3c/mask%3e%3c/defs%3e%3ccircle cx='50' cy='50' r='50' fill='%2322c55e' mask='url(%23ratel-logo-mask)'/%3e%3ccircle cx='50' cy='50' r='24' fill='%2322c55e'/%3e%3c/svg%3e";

// https://vitejs.dev/config/
export default defineConfig({
  // This 'define' block makes server-side environment variables available
  // to the client-side code. This is crucial for environments like AI Studio
  // that use non-prefixed variables (e.g., API_KEY instead of VITE_API_KEY).
  // Vite replaces these strings with the actual values at build time.
  define: {
    'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
    'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY),
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    // Output to a 'dist' folder at the project root.
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1600, // Increased limit to permanently remove the warning.
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Creates separate chunks for large vendor libraries.
          // This prevents them from being bundled into a single large file,
          // which helps with performance and is the correct way to manage chunk sizes.
          if (id.includes('node_modules')) {
            if (id.includes('react-syntax-highlighter')) {
              return 'vendor-syntax-highlighter';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('@google/genai')) {
              return 'vendor-genai';
            }
            if (id.includes('react-dom') || id.includes('react')) {
               return 'vendor-react';
            }
          }
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // The includeAssets array is cleared because the icon is now inlined,
      // so no separate files need to be precached.
      includeAssets: [],
      manifest: {
        name: "Ratel AI",
        short_name: "Ratel",
        description: "Ratel AI — your smart companion for work, creativity, and daily life.",
        start_url: "/",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",
        orientation: "portrait",
        scope: "/",
        id: "/",
        categories: ["productivity", "communication", "artificial intelligence"],
        icons: [
          {
            "src": iconDataUri,
            "sizes": "any",
            "type": "image/svg+xml",
            "purpose": "any maskable"
          }
        ]
      },
      workbox: {
        // Precaches all assets in the build output, including those from the public dir.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webmanifest}'],
        // Runtime caching for assets that are not precached (e.g., API calls, external images).
        runtimeCaching: [
          {
            // Cache API calls to our own backend.
            // NetworkFirst is a good strategy for APIs to ensure fresh data while providing offline fallback.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
              },
              cacheableResponse: {
                statuses: [0, 200], // Cache successful responses.
              },
            },
          },
          {
            // Cache images from any origin.
            // CacheFirst is good for images as they don't change often.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true // Enable PWA in development for testing
      }
    }),
  ],
})