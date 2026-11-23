import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Konfigurasi Vite & VitePWA untuk PartsBin PWA
// Memenuhi Aturan Asprak R2: PWA, Service Worker, Manifest, Offline Caching
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'PartsBin — Katalog Komponen & Kalkulator BOM',
        short_name: 'PartsBin',
        description: 'Katalog Komponen Mikro & Kalkulator BOM Proyek Elektronika',
        theme_color: '#070b14',
        background_color: '#070b14',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // API: NetworkFirst dengan matcher fungsi ({ url }) => url.pathname.startsWith('/api/')
            // Berfungsi lintas-origin (frontend & backend beda subdomain Vercel)
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              cacheName: 'partsbin-api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 hari
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Gambar: CacheFirst untuk Supabase Storage bucket project-images
            urlPattern: ({ url }) =>
              url.pathname.includes('/storage/v1/object/public/project-images/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'partsbin-images',
              expiration: {
                maxEntries: 150, // Dinaikkan untuk menampung foto dokumentasi proyek di cache
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
});
