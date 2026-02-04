import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/brain/',
    server: {
        host: true, // Necesario para Docker
        port: 5173,
        allowedHosts: ['marcobarrera.cloud'],
        watch: {
            usePolling: true // Necesario para Docker en Windows a veces
        }
    }
})
