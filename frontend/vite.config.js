import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Only proxy API requests starting with /api/ or exactly /api
      '^/api(/|$)': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
