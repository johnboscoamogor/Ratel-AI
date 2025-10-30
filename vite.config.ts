import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    // Output to a 'dist' folder at the project root.
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Explicitly include icons and favicon in the service worker precache.
      // This ensures they are available offline for the install prompt and splash screen.
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'icon-192x192.png', 'icon-512x512.png'],
      manifest: {
        name: "Ratel AI",
        short_name: "Ratel",
        description: "Ratel AI — your smart companion for work, creativity, and daily life.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        orientation: "portrait",
        scope: "/",
        id: "/",
        categories: ["productivity", "communication", "artificial intelligence"],
        icons: [
          {
            "src": "/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable"
          },
          {
            "src": "/icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png",
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