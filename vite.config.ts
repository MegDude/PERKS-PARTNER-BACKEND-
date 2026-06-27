import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      chunkSizeWarningLimit: 650,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router-dom/')) return 'react';
            if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'firebase';
            if (id.includes('/@tanstack/react-query/')) return 'query';
            if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-vendor/')) return 'charts';
            if (id.includes('/lucide-react/') || id.includes('/framer-motion/') || id.includes('/motion/')) return 'ui';
            return undefined;
          },
        },
      },
    },
  };
});
