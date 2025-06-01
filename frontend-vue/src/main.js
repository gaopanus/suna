import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import pinia from './store';
import vuetify from './plugins/vuetify';
import i18n from './plugins/i18n'; // Import i18n plugin
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import '@mdi/font/css/materialdesignicons.css';

import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/themeStore'; // Import theme store

const app = createApp(App);

app.use(pinia); // Use Pinia first so stores are available

// Initialize Auth and Theme stores and their initial setup logic
const authStore = useAuthStore();
authStore.initializeAuthListener();

const themeStore = useThemeStore();
themeStore.applyInitialTheme(); // Apply theme before mounting

app.use(i18n); // Use i18n plugin
app.use(router);
app.use(vuetify);

app.mount('#app');
