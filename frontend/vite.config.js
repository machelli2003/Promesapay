import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: mode === 'development' ? {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    } : undefined,
  },
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    minify: mode === 'production' ? 'terser' : false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['axios', 'react-hot-toast', 'framer-motion'],
        },
      },
    },
  },
  define: {
    __APP_ENV__: JSON.stringify(mode),
  },
}));