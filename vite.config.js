import { defineConfig } from 'vite';
import { bookEditor } from './server/book-editor.js';

export default defineConfig({
  plugins: [bookEditor()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'] },
      },
    },
  },
});
