import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true, // Enables automatic importing of Vuetify components and directives
    }),
  ],
  define: { 'process.env': {} }, // Recommended for Vuetify 3
  resolve: {
    alias: {
      '@': '/src', // Optional: for cleaner imports
    },
  },
  server: {
    port: 3001, // Optional: specify dev server port
  },
});
