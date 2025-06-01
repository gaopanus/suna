// src/plugins/vuetify.js
import 'vuetify/styles'; // Global Vuetify styles
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi'; // Material Design Icons

// Optional: Define custom themes
const myCustomLightTheme = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    primary: '#6200EE',
    'primary-darken-1': '#3700B3',
    secondary: '#03DAC6',
    'secondary-darken-1': '#018786',
    error: '#B00020',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
  },
};

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'myCustomLightTheme', // You can use 'light' or 'dark' or your custom theme
    themes: {
      myCustomLightTheme,
      // You can also define a dark theme here if needed
      // myCustomDarkTheme: { ... }
    },
  },
  icons: {
    defaultSet: 'mdi', // This is already the default value - only for display purposes
    aliases,
    sets: {
      mdi,
    },
  },
  // Other global configurations
  // defaults: {
  //   VBtn: {
  //     color: 'primary',
  //     variant: 'outlined',
  //   },
  // },
});

export default vuetify;
