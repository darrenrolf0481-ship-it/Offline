import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3002,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/scheduler/')) {
                return 'vendor-react';
              }
              if (id.includes('/node_modules/framer-motion/')) {
                return 'vendor-motion';
              }
              if (id.includes('/node_modules/recharts/') || id.includes('/node_modules/d3') || id.includes('/node_modules/victory-vendor/')) {
                return 'vendor-charts';
              }
              if (id.includes('/node_modules/prettier/')) {
                return 'vendor-prettier';
              }
              if (id.includes('/node_modules/ollama/')) {
                return 'vendor-ollama';
              }
              if (id.includes('/node_modules/jszip/')) {
                return 'vendor-jszip';
              }
              if (id.includes('/node_modules/lucide-react/')) {
                return 'vendor-icons';
              }
            }
          }
        }
      }
    };
});
