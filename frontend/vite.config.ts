import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/brain/',
    server: {
        host: true,
        port: 5173,
        allowedHosts: ['marcobarrera.cloud'],
        proxy: {
            '/api': {
                target: 'http://backend:8000',
                changeOrigin: true,
                secure: false,
            }
        },
        watch: {
            usePolling: true
        }
    }
})
