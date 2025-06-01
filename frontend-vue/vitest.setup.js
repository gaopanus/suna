import { config } from '@vue/test-utils';
import vuetify from './src/plugins/vuetify'; // Import your Vuetify plugin instance
// import { createI18n } from 'vue-i18n';

// Make Vuetify available to all tests
config.global.plugins = [vuetify];

// --- localStorage Mock ---
// This is useful for stores that interact with localStorage (e.g., authStore, themeStore)
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true // Allow tests to spyOn or modify if necessary
});

// --- scrollTo Mock ---
// happy-dom doesn't implement scrollTo. If components call it (e.g., after navigation or list updates)
// and you don't want errors or need to test its invocation, mock it.
if (typeof window !== 'undefined') {
    window.scrollTo = vi.fn(); // Using Vitest's vi for mocking
}


// --- i18n Mock (Example - if truly needed globally and very basic) ---
// It's often better to mock i18n specifically in test files where needed,
// or use a more sophisticated approach for testing translated content.
//
// const i18n = createI18n({
//   legacy: false,
//   locale: 'en',
//   fallbackLocale: 'en',
//   messages: {
//     en: { /* minimal common messages or leave empty */ },
//     fr: { /* minimal common messages or leave empty */ },
//   },
//   // Suppress warnings for missing translations in tests if they are not relevant
//   missingWarn: false,
//   fallbackWarn: false,
// });
// config.global.plugins.push(i18n); // Add to existing plugins

// --- Global Mocks for Vue Router (if components deeply depend on it) ---
// config.global.mocks = {
//   $router: {
//     push: vi.fn(),
//     replace: vi.fn(),
//     resolve: vi.fn(),
//     back: vi.fn(),
//     forward: vi.fn(),
//     go: vi.fn(),
//     currentRoute: ref({ path: '/', name: 'Home', params: {}, query: {} }) // Basic mock
//   },
//   $route: { path: '/', name: 'Home', params: {}, query: {} } // Basic mock
// };

// --- Pinia Store Mocks (Alternative to providing real stores in tests) ---
// You might set up default mocks for certain stores if they are globally accessed
// and you don't want to provide the real store in every test.
// However, for store unit tests, you use createPinia() and the real store.
// For component tests, providing a mocked store or a real one via createPinia() is common.

// Example: Mocking a specific action from a store globally (use with caution)
// import { vi } from 'vitest';
// vi.mock('@/store/someStore', () => ({
//   useSomeStore: () => ({
//     someAction: vi.fn().mockResolvedValue({ success: true }),
//     someGetter: computed(() => 'mockValue'),
//   }),
// }));


// Before each test, you might want to reset mocks or localStorage
beforeEach(() => {
  localStorageMock.clear();
  // vi.clearAllMocks(); // If using vi.mock for auto-mocking modules
});

console.log('Vitest setup file loaded.');
