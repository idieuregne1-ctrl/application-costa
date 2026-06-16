import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Le frontend tourne sur :5173 et proxie tout /api vers le backend Express (:8787).
// Les clés API restent côté serveur — jamais exposées au client.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'La crème de la crème',
        short_name: 'La crème',
        description:
          'Trouve la crème de la crème autour de toi : restaurants, activités, plages, randonnée, pêche et culture locale.',
        theme_color: '#faf7f1',
        background_color: '#faf7f1',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'fr',
        icons: [
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        // Stratégies de cache hors ligne (Phase 12) : cache-first pour les médias
        // (tuiles de carte, photos) et network-first pour les API (à jour quand en
        // ligne, repli sur le cache hors ligne). Expiration à quelques jours pour
        // rester conforme aux conditions des sources.
        runtimeCaching: [
          {
            // Polices Google (affichage serif) — cache long.
            urlPattern: /fonts\.(googleapis|gstatic)\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /tile\.openstreetmap\.org/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Photos Google (proxy) et CDN Foursquare.
            urlPattern: /(\/api\/google\/photo)|(4sqi\.net)|(fastly\.4sqi)|(fsquare)/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'place-photos',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Réponses API : network-first, repli cache hors ligne.
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 2 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // SW désactivé en dev pour éviter le cache pendant le développement
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  // `vite preview` (build de prod servi) utilise sa propre config proxy.
  preview: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
