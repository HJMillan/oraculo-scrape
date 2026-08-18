import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

/** SHA del commit desplegado — Vercel lo expone en build; en local queda 'dev'. */
const commit = (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7) || 'dev'

// https://vitejs.dev/config/
export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(version),
        __APP_COMMIT__: JSON.stringify(commit),
    },
    plugins: [
        react(),
        tailwindcss(),
    ],
    build: {
        target: 'es2020',
        cssCodeSplit: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                },
            },
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            }
        }
    }
})
