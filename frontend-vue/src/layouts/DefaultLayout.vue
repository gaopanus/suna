<template>
  <v-app :theme="themeStore.activeThemeName">
    <v-navigation-drawer v-model="drawer" temporary app>
      <v-list nav dense>
        <v-list-item prepend-icon="mdi-folder-multiple-outline" :title="$t('projects')" to="/projects"></v-list-item>
        <v-list-item prepend-icon="mdi-store-search-outline" :title="$t('agentMarketplace')" to="/agents/marketplace"></v-list-item>
        <v-list-item prepend-icon="mdi-robot-happy-outline" :title="$t('myAgents')" to="/agents/my-agents"></v-list-item>

        <v-divider class="my-2"></v-divider>

        <v-list-item prepend-icon="mdi-cog-outline" :title="$t('settings')" to="/settings"></v-list-item>
        <v-list-item prepend-icon="mdi-credit-card-outline" :title="$t('billing')" to="/billing"></v-list-item>

        <v-divider class="my-2"></v-divider>

        <v-list-item v-if="authStore.isAuthenticated" @click="handleLogout" prepend-icon="mdi-logout" :title="$t('logout')"></v-list-item>
        <v-list-item v-else prepend-icon="mdi-login" :title="$t('login')" to="/login"></v-list-item>

      </v-list>
    </v-navigation-drawer>

    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title @click="goHome" style="cursor: pointer;">My Suna App</v-toolbar-title>
      <v-spacer></v-spacer>

      <LanguageSwitcher class="mr-1" />

      <v-btn icon @click="themeStore.toggleTheme()" aria-label="Toggle theme">
        <v-icon>mdi-theme-light-dark</v-icon>
      </v-btn>

      <v-chip v-if="authStore.isAuthenticated && authStore.currentUser" pill class="ml-3" outlined>
        <v-avatar left>
            <v-icon>mdi-account-circle</v-icon>
        </v-avatar>
        {{ authStore.userDisplayName }}
      </v-chip>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import { useThemeStore } from '@/store/themeStore'; // Import theme store
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'vue-router';
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'; // Import LanguageSwitcher

const drawer = ref(false);
const themeStore = useThemeStore(); // Use theme store
const authStore = useAuthStore();
const router = useRouter();

// Theme toggling is now handled by themeStore.toggleTheme()

async function handleLogout() {
    try {
        await authStore.logout();
    } catch (error) {
        console.error("Logout failed from layout:", error);
    }
}

function goHome() {
    if (authStore.isAuthenticated) {
        router.push('/projects');
    } else {
        router.push('/login');
    }
}
</script>

<style scoped>
.v-main {
  /* Ensure this padding matches your v-app-bar's height if it's not 'app' */
  /* padding-top: 64px;  */
}
</style>
