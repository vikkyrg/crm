import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiTarget = (process.env.VITE_API_URL || 'http://127.0.0.1:5002').replace(/\/+$/, '');

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: false
      }
    }
  }
});
