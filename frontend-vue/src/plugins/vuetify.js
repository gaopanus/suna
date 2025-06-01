// src/plugins/vuetify.js
import 'vuetify/styles'; // Global Vuetify styles
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
// No need to import useThemeStore here directly for initial theme,
// main.js or App.vue will call themeStore.applyInitialTheme() after Vuetify is created.

// Define custom themes
const myCustomLightTheme = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#F7F8FA', // Slightly off-white for surfaces
    primary: '#6200EE', // Default primary
    'primary-darken-1': '#3700B3',
    secondary: '#03DAC6', // Default secondary
    'secondary-darken-1': '#018786',
    error: '#B00020',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
    // Add more custom colors if needed
    // 'app-bar': '#FFFFFF',
    // 'nav-drawer': '#F1F1F1',
  },
};

const myCustomDarkTheme = {
  dark: true, // Important: set dark to true
  colors: {
    background: '#121212', // Standard dark background
    surface: '#1E1E1E', // Slightly lighter surface for cards, etc.
    primary: '#BB86FC', // Material Design dark theme primary (adjust as needed)
    'primary-darken-1': '#3700B3', // Might need adjustment for dark theme
    secondary: '#03DAC5', // Material Design dark theme secondary
    'secondary-darken-1': '#018786', // Might need adjustment
    error: '#CF6679', // Material Design dark theme error
    info: '#2196F3', // Often same as light, or adjust
    success: '#4CAF50', // Often same as light, or adjust
    warning: '#FB8C00', // Often same as light, or adjust
    // 'app-bar': '#1E1E1E',
    // 'nav-drawer': '#272727',
  },
};


// Retrieve initial theme name from localStorage or set a default.
// This part is primarily for createVuetify's initial setup.
// The themeStore will manage the dynamic changes later.
const THEME_STORAGE_KEY_FOR_INIT = 'app_theme_preference';
const DEFAULT_THEME_FOR_INIT = 'myCustomLightTheme'; // Should match themeStore's default
const DARK_THEME_NAME_FOR_INIT = 'dark'; // Standard Vuetify dark theme name

let initialThemeName = DEFAULT_THEME_FOR_INIT;
if (typeof window !== 'undefined') { // Check if localStorage is available
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY_FOR_INIT);
    if (storedTheme && (storedTheme === DEFAULT_THEME_FOR_INIT || storedTheme === DARK_THEME_NAME_FOR_INIT)) {
        initialThemeName = storedTheme;
    } else {
        // Optional: check system preference if no valid theme stored
        // const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        // initialThemeName = prefersDark ? DARK_THEME_NAME_FOR_INIT : DEFAULT_THEME_FOR_INIT;
        // localStorage.setItem(THEME_STORAGE_KEY_FOR_INIT, initialThemeName); // Store the determined initial theme
    }
}


const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: initialThemeName, // Set the initial theme here
    themes: {
      myCustomLightTheme, // Your custom light theme
      dark: myCustomDarkTheme, // Your custom dark theme (using 'dark' as its name)
      // You can add more themes here:
      // 'anotherLightTheme': { dark: false, colors: { ... } },
      // 'anotherDarkTheme': { dark: true, colors: { ... } },
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
});

export default vuetify;

// After this Vuetify instance is created and used by the Vue app,
// the themeStore's `applyInitialTheme()` action should be called (e.g., in main.js or App.vue's onMounted).
// This ensures that Vuetify's reactive theme system is correctly synced with the themeStore's state
// (which also reads from localStorage for its initial state).
// Example:
// main.js
// const app = createApp(App);
// app.use(pinia); // Initialize Pinia
// app.use(vuetify); // Initialize Vuetify
// const themeStore = useThemeStore(); // Get theme store instance
// themeStore.applyInitialTheme(); // Sync store with Vuetify's current theme & apply stored pref
// app.mount('#app');
