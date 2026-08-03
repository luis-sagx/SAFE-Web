import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // El servidor de desarrollo hace el mismo papel que Nginx en producción:
  // enruta cada prefijo a su microservicio. Sin esto habría que arrancar los
  // dos servicios con CORS abierto y el frontend tendría que saber en qué
  // puerto vive cada uno — justo lo que el gateway existe para evitar.
  server: {
    proxy: {
      '/api/auth': 'http://localhost:3001',
      '/api/runs': 'http://localhost:3002',
      '/api/health': 'http://localhost:3001',
    },
  },
})
