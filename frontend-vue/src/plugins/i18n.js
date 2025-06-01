import { createI18n } from 'vue-i18n';
import en from '../locales/en.json';
import fr from '../locales/fr.json';

// Function to get persisted language or default
const getPersistedLanguage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const lang = localStorage.getItem('appLanguage');
    // You might want to check if `lang` is a supported locale
    // For now, just return it if it exists, otherwise default
    return lang || 'en';
  }
  return 'en'; // Default for SSR or if localStorage is not available
};

const i18n = createI18n({
  legacy: false, // Use Composition API (Vue 3 default)
  locale: getPersistedLanguage(), // Set initial locale
  fallbackLocale: 'en', // Fallback locale if translation is missing
  messages: {
    en,
    fr,
  },
  // silentTranslationWarn: true, // Optional: suppress warnings for missing translations during development
  // missingWarn: false, // Suppress warnings for missing translations
  // fallbackWarn: false, // Suppress warnings for fallback to fallbackLocale
});

export default i18n;
