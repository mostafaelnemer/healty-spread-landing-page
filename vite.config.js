import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react-vendor';
          }
          if (id.includes('StepConfirm') || id.includes('FlavorPicker')) {
            return 'checkout';
          }
          if (id.includes('ProductShowcase')) {
            return 'gallery';
          }
        },
      },
    },
  },
  // SPA fallback — redirect all routes to index.html
  server: {
    historyApiFallback: true,
  },
});