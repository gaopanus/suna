<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" temporary app>
      <v-list nav dense>
        <v-list-item prepend-icon="mdi-folder-multiple-outline" title="Projects" to="/projects"></v-list-item>
        <v-list-item prepend-icon="mdi-store-search-outline" title="Agent Marketplace" to="/agents/marketplace"></v-list-item>
        <v-list-item prepend-icon="mdi-robot-happy-outline" title="My Agents" to="/agents/my-agents"></v-list-item>

        <v-divider class="my-2"></v-divider>

        <v-list-item prepend-icon="mdi-cog-outline" title="Settings" to="/settings"></v-list-item>
        <v-list-item prepend-icon="mdi-credit-card-outline" title="Billing" to="/billing"></v-list-item>

        <v-divider class="my-2"></v-divider>

        <v-list-item v-if="authStore.isAuthenticated" @click="handleLogout" prepend-icon="mdi-logout" title="Logout"></v-list-item>
        <v-list-item v-else prepend-icon="mdi-login" title="Login" to="/login"></v-list-item>

      </v-list>
    </v-navigation-drawer>

    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title @click="goHome" style="cursor: pointer;">My Suna App</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-chip v-if="authStore.isAuthenticated && authStore.currentUser" pill class="mr-3" outlined>
        <v-avatar left>
            <v-icon>mdi-account-circle</v-icon>
        </v-avatar>
        {{ authStore.currentUser.email }}
      </v-chip>
      <v-btn icon @click="toggleTheme">
        <v-icon>mdi-theme-light-dark</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <router-view /> <!-- Page content will be rendered here -->
      </v-container>
    </v-main>

    <!-- Footer can be simplified or removed if not essential for app layout -->
    <!--
    <v-footer app>
      <span class="text-center w-100">&copy; {{ new Date().getFullYear() }} — My Vue App</span>
    </v-footer>
    -->
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import { useTheme } from 'vuetify';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'vue-router';

const drawer = ref(false);
const theme = useTheme();
const authStore = useAuthStore();
const router = useRouter();

function toggleTheme () {
  theme.global.name.value = theme.global.current.value.dark ? 'myCustomLightTheme' : 'dark';
}

async function handleLogout() {
    try {
        await authStore.logout();
        // Router's onAuthStateChange or guard should redirect to login
    } catch (error) {
        console.error("Logout failed from layout:", error);
        // Optionally show a notification via notificationsStore
    }
}

function goHome() {
    if (authStore.isAuthenticated) {
        router.push('/projects'); // Or your main authenticated route
    } else {
        router.push('/login');
    }
}
</script>

<style scoped>
/* Layout specific styles */
.v-main {
  /* padding-top: 64px; Adjust if app-bar height changes and is not 'app' */
  /* padding-bottom: 56px; Adjust if footer height changes and is not 'app' */
}
</style>
