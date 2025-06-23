import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // for 'ReferenceError: global is not defined' error
    // ref: https://github.com/vitejs/vite/discussions/5912
    global: {},
  },
  resolve: {
    alias: {
      'openapi-to-normalizr': path.resolve(__dirname, '../src/lib/index.ts'),
    },
  },
});
