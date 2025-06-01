import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // router needs to be imported before auth store if auth store uses router
import pinia from './store';
import vuetify from './plugins/vuetify';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import '@mdi/font/css/materialdesignicons.css';

import { useAuthStore } from '@/store/auth'; // Import the auth store

const app = createApp(App);

app.use(pinia); // Use Pinia first so stores are available

// Initialize the Supabase auth listener AFTER Pinia is initialized
// This ensures the store is ready to react to auth events.
const authStore = useAuthStore();
authStore.initializeAuthListener(); // Call the action to set up the listener and load initial session

app.use(router);
app.use(vuetify);

app.mount('#app');
