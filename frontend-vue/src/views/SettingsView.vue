<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h5">
            Settings
          </v-card-title>
          <v-card-text>
            <p class="text-body-1">
              User settings, application preferences, and other configurations will be managed here.
            </p>
            <v-divider class="my-4"></v-divider>

            <h3 class="text-h6 mt-4 mb-2">Profile Settings</h3>
            <v-list-item lines="two">
              <v-list-item-title>User Email</v-list-item-title>
              <v-list-item-subtitle>{{ authStore.currentUser?.email || 'Not logged in' }}</v-list-item-subtitle>
            </v-list-item>
            <!-- Add more profile settings here, e.g., change password, display name -->
            <v-btn color="secondary" class="mt-2" disabled>Change Password (Coming Soon)</v-btn>

            <h3 class="text-h6 mt-6 mb-2">Theme Settings</h3>
            <v-select
              v-model="selectedTheme"
              :items="themes"
              label="Application Theme"
              outlined
              dense
              @update:modelValue="applyTheme"
            ></v-select>

            <h3 class="text-h6 mt-6 mb-2">Notifications</h3>
             <v-switch
                v-model="enableNotifications"
                color="primary"
                label="Enable In-App Notifications"
                inset
                disabled
            ></v-switch>
            <p class="text-caption">Further notification preferences here.</p>

            <v-divider class="my-4"></v-divider>
            <p class="text-caption text-grey">
              More settings will be available in future updates.
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTheme } from 'vuetify';
import { useAuthStore } from '@/store/auth';

const theme = useTheme();
const authStore = useAuthStore();

const themes = ref([
  { title: 'Light Mode', value: 'myCustomLightTheme' }, // Assuming this is defined in vuetify plugin
  { title: 'Dark Mode', value: 'dark' }, // Assuming 'dark' is a defined theme
]);

// Initialize selectedTheme based on current Vuetify theme
const selectedTheme = ref(theme.global.name.value);
const enableNotifications = ref(true); // Placeholder

function applyTheme(newThemeName) {
  theme.global.name.value = newThemeName;
  // Optionally, save this preference to localStorage or user settings
}
</script>

<style scoped>
/* Add specific styles if needed */
</style>
