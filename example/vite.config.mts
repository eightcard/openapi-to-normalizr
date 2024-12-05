import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // for 'ReferenceError: global is not defined' error
    // ref: https://github.com/vitejs/vite/discussions/5912
    global: {},
  },
});
