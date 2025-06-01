import { defineStore } from 'pinia';
import { useTheme as useVuetifyTheme } from 'vuetify'; // Import Vuetify's useTheme

const THEME_STORAGE_KEY = 'app_theme_preference';
const DEFAULT_THEME = 'myCustomLightTheme'; // Ensure this matches a defined theme in vuetify.js
const DARK_THEME_NAME = 'dark'; // Standard Vuetify dark theme name, or your custom dark theme

export const useThemeStore = defineStore('theme', {
  state: () => {
    // Initialize theme from localStorage or default
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    let initialIsDark;
    if (storedTheme) {
      initialIsDark = storedTheme === DARK_THEME_NAME;
    } else {
      // Optional: Check system preference if no stored theme
      // const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      // initialIsDark = prefersDark;
      initialIsDark = false; // Default to light if no system preference check or no stored theme
    }
    return {
      // isDarkMode: initialIsDark, // We'll derive this from the actual theme name
      currentThemeName: storedTheme || (initialIsDark ? DARK_THEME_NAME : DEFAULT_THEME),
    };
  },
  getters: {
    isDarkMode: (state) => state.currentThemeName === DARK_THEME_NAME,
    activeThemeName: (state) => state.currentThemeName,
  },
  actions: {
    /**
     * Applies the theme to Vuetify and stores the preference.
     * This should be called once when the app initializes.
     */
    applyInitialTheme() {
      const vuetifyTheme = useVuetifyTheme();
      if (vuetifyTheme.themes.value[this.currentThemeName]) {
        vuetifyTheme.global.name.value = this.currentThemeName;
      } else {
        console.warn(`Theme "${this.currentThemeName}" not found in Vuetify config. Falling back to default.`);
        vuetifyTheme.global.name.value = DEFAULT_THEME; // Fallback
        this.currentThemeName = vuetifyTheme.global.name.value;
        localStorage.setItem(THEME_STORAGE_KEY, this.currentThemeName);
      }
    },

    /**
     * Sets the application theme.
     * @param {'light' | 'dark' | string} themeName - The name of the theme to set (e.g., 'myCustomLightTheme', 'dark').
     */
    setTheme(themeName) {
      const vuetifyTheme = useVuetifyTheme(); // Get Vuetify's theme instance

      if (vuetifyTheme.themes.value[themeName]) {
        vuetifyTheme.global.name.value = themeName;
        this.currentThemeName = themeName;
        localStorage.setItem(THEME_STORAGE_KEY, themeName);
        console.log(`Theme changed to: ${themeName}`);
      } else {
        console.error(`Attempted to set unknown theme: ${themeName}`);
      }
    },

    /**
     * Toggles between the default light and dark themes.
     */
    toggleTheme() {
      const newThemeName = this.currentThemeName === DARK_THEME_NAME ? DEFAULT_THEME : DARK_THEME_NAME;
      this.setTheme(newThemeName);
    },
  },
});

// How to initialize:
// In your main.js or App.vue (setup script, after Pinia is initialized):
// import { useThemeStore } from '@/store/themeStore';
// const themeStore = useThemeStore();
// themeStore.applyInitialTheme(); // This will apply the theme stored in localStorage or default
//
// Then, in SettingsView.vue, you can call themeStore.setTheme('newThemeName') or themeStore.toggleTheme().
