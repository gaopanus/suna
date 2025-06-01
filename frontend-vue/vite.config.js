import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
    }),
  ],
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3001,
  },
  // Vitest configuration
  test: {
    globals: true, // Use global APIs like describe, it, expect
    environment: 'happy-dom', // Or 'jsdom' for better compatibility with some browser APIs
    setupFiles: ['./vitest.setup.js'], // Optional setup file
    deps: {
      inline: [
        'vuetify', // Ensure Vuetify components are transformed during tests
      ],
    },
    // Optional: Configure coverage reporting
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      all: true, // Include all files in src, not just tested ones
      include: ['src/**/*.{js,vue}'],
      exclude: [ // Exclude files from coverage
        'src/main.js',
        'src/router/index.js',
        'src/plugins/**',
        'src/locales/**',
        'src/App.vue', // Or test it if it has logic
        'src/**/index.js', // Barrel files
        'src/**/*.spec.js', // Test files themselves
        'src/**/types.js', // Type definition files
        'vitest.setup.js',
        // Add other paths to exclude as needed
      ],
    },
  },
});
