<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
    <GlobalNotificationHandler />
  </v-app>
</template>

<script setup>
import GlobalNotificationHandler from '@/components/common/GlobalNotificationHandler.vue';
import { onMounted } from 'vue';
import { useAuthStore } from '@/store/auth';
import { useNotificationsStore } from '@/store/notifications'; // For example usage

// Initialize auth listener when App is mounted
// This was previously in main.js, but App.vue's setup is also a good place
// to ensure Pinia stores are definitely available.
const authStore = useAuthStore();
onMounted(() => {
  authStore.initializeAuthListener();

  // Example: Show a welcome notification if you want
  // const notificationsStore = useNotificationsStore();
  // if (authStore.isAuthenticated) {
  //   notificationsStore.showInfo(`Welcome back, ${authStore.currentUser?.email || 'user'}!`);
  // } else {
  //   notificationsStore.showInfo('Welcome! Please login or signup.');
  // }
});

</script>

<style>
/* Global styles can go here or in src/styles/main.css */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  /* overflow: hidden; /* To prevent double scrollbars if v-main/v-layout handles it */
}

/* Example of global scrollbar styling (optional) */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>
