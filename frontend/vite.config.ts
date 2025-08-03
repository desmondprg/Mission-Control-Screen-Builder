import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true,
    proxy: {
      '/api': 'http://backend:8080',   
      '/ws': {
        target: 'ws://backend:8080',
        ws: true,
      },
      '/swagger': 'http://backend:8080',
    },
  },
});
