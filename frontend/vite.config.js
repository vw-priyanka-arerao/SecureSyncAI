import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    cors: {
      origin: /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
    },
    allowedHosts: ['localhost', '127.0.0.1'],
    proxy: {
      '/api': 'http://localhost:8080',
      '/actuator': 'http://localhost:8080',
      '/v3': 'http://localhost:8080'
    }
  }
});

