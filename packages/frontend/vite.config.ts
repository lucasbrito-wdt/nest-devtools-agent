import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // Permite acesso de fora do container
    port: 3000,
    strictPort: true,
    watch: {
      usePolling: true, // Necessário para hot reload no Docker
    },
    proxy: {
      '/api': {
        target: 'http://backend:4001',
        changeOrigin: true,
      },
    },
  },
});
