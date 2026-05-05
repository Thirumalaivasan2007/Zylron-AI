import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
            manifest: {
                name: 'Zylron AI',
                short_name: 'Zylron',
                description: 'Advanced Multimodal AI Ecosystem',
                theme_color: '#000000',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            workbox: {
                maximumFileSizeToCacheInBytes: 10 * 1024 * 1024 // 10 MB limit for large chunks
            }
        })
    ],
    build: {
        target: 'esnext' // Support for top-level await used by pdfjs-dist
    },
    esbuild: {
        target: 'esnext'
    },
    optimizeDeps: {
        esbuildOptions: {
            target: 'esnext'
        }
    },
    server: {
        port: 3000,
        host: true, // Exposes the server to your local Network (Mobile/Phone access)
        proxy: {
            '/api': {
                target: 'http://localhost:5001',
                changeOrigin: true,
                secure: false,
            }
        }
    }
})
