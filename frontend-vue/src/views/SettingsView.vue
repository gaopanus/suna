<template>
  <v-container fluid>
    <h1 class="text-h4 mb-6">{{ $t('settings') }}</h1>

    <v-row>
      <v-col cols="12" md="8" lg="7">
        <v-expansion-panels v-model="panel" multiple variant="inset">
          <!-- Profile Section -->
          <v-expansion-panel value="profile">
            <v-expansion-panel-title class="text-h6">
              <v-icon start>mdi-account-circle-outline</v-icon>
              {{ $t('profile') }}
            </v-expansion-panel-title>
            <v-expansion-panel-text class="pa-4">
              <v-form @submit.prevent="handleProfileUpdate" ref="profileFormRef">
                <v-text-field
                  label="Email (Read-only)"
                  :model-value="authStore.currentUser?.email"
                  readonly
                  variant="filled"
                  class="mb-4"
                ></v-text-field>

                <v-text-field
                  v-model="profileData.displayName"
                  :label="$t('displayName')"
                  :rules="[rules.required]"
                  required
                  variant="outlined"
                  class="mb-3"
                  hint="This name will be displayed publicly."
                  persistent-hint
                ></v-text-field>

                <v-btn
                    type="submit"
                    color="primary"
                    :loading="profileLoading"
                    :disabled="!isProfileChanged"
                >
                    {{ $t('save') }} Profile
                </v-btn>
              </v-form>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Security Section -->
          <v-expansion-panel value="security">
            <v-expansion-panel-title class="text-h6">
              <v-icon start>mdi-lock-outline</v-icon>
              {{ $t('security') }}
            </v-expansion-panel-title>
            <v-expansion-panel-text class="pa-4">
              <h3 class="text-subtitle-1 font-weight-medium mb-3">{{ $t('changePassword') }}</h3>
              <v-form @submit.prevent="handlePasswordChange" ref="passwordFormRef">
                <v-text-field
                  v-model="passwordData.newPassword"
                  :label="$t('newPassword')"
                  type="password"
                  variant="outlined"
                  class="mb-3"
                  :rules="[rules.required, rules.minPassword(8)]"
                  hint="Minimum 8 characters"
                ></v-text-field>

                <v-text-field
                  v-model="passwordData.confirmNewPassword"
                  :label="$t('confirmNewPassword')"
                  type="password"
                  variant="outlined"
                  class="mb-3"
                  :rules="[rules.required, rules.passwordMatch]"
                ></v-text-field>

                <v-btn type="submit" color="primary" :loading="passwordLoading">
                  {{ $t('changePassword') }}
                </v-btn>
              </v-form>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Appearance Section -->
          <v-expansion-panel value="appearance">
            <v-expansion-panel-title class="text-h6">
              <v-icon start>mdi-palette-outline</v-icon>
              {{ $t('appearance') }}
            </v-expansion-panel-title>
            <v-expansion-panel-text class="pa-4">
              <h3 class="text-subtitle-1 font-weight-medium mb-3">{{ $t('theme') }}</h3>
              <v-select
                v-model="selectedThemeName"
                :items="availableThemes"
                item-title="title"
                item-value="value"
                label="Application Theme"
                variant="outlined"
                dense
                @update:modelValue="applySelectedTheme"
              ></v-select>

              <h3 class="text-subtitle-1 font-weight-medium mb-3 mt-4">{{ $t('language') }}</h3>
              <LanguageSwitcher dense variant="text" /> <!-- Example of embedding it here too -->
               <v-select
                :model-value="i18n.locale.value"
                @update:modelValue="setLocale"
                :items="languageSelectorItems"
                item-title="name"
                item-value="code"
                label="Select Language"
                variant="outlined"
                dense
                class="mt-2"
              ></v-select>


            </v-expansion-panel-text>
          </v-expansion-panel>

        </v-expansion-panels>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/auth';
import { useNotificationsStore } from '@/store/notifications';
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'; // For direct use if needed
import { useI18n } from 'vue-i18n'; // Import useI18n

const themeStore = useThemeStore();
const authStore = useAuthStore();
const notificationsStore = useNotificationsStore();
const i18n = useI18n(); // Get i18n instance

const panel = ref(['profile']);

// --- Profile Data ---
const profileFormRef = ref(null);
const profileData = ref({ displayName: '' });
const originalDisplayName = ref('');
const profileLoading = ref(false);
const isProfileChanged = computed(() => profileData.value.displayName !== originalDisplayName.value);

// --- Password Data ---
const passwordFormRef = ref(null);
const passwordData = ref({ newPassword: '', confirmNewPassword: '' });
const passwordLoading = ref(false);

// --- Theme Data ---
const availableThemes = computed(() => [
  { title: i18n.t('light'), value: 'myCustomLightTheme' },
  { title: i18n.t('dark'), value: 'dark' },
]);
const selectedThemeName = ref(themeStore.activeThemeName);

// --- Language Data ---
const languageSelectorItems = computed(() => [
    { code: 'en', name: i18n.t('english') },
    { code: 'fr', name: i18n.t('french') },
]);

// --- Rules ---
const rules = {
  required: value => !!value || 'This field is required.',
  minLength: (len) => value => (value && value.length >= len) || `Must be at least ${len} characters.`,
  minPassword: (len) => value => (value && value.length >= len) || i18n.t('newPassword') + ` must be at least ${len} characters.`, // Example of translating rule text
  passwordMatch: value => value === passwordData.value.newPassword || 'Passwords do not match.',
};

// --- Methods ---
onMounted(() => {
  if (authStore.currentUser?.user_metadata) {
    profileData.value.displayName = authStore.currentUser.user_metadata.full_name || '';
    originalDisplayName.value = profileData.value.displayName;
  }
  selectedThemeName.value = themeStore.activeThemeName;
});

watch(() => authStore.currentUser?.user_metadata?.full_name, (newName) => {
    if (newName !== profileData.value.displayName && !profileLoading.value) {
        profileData.value.displayName = newName || '';
        originalDisplayName.value = newName || '';
    }
});

async function handleProfileUpdate() {
  authStore.clearError();
  const { valid } = await profileFormRef.value.validate();
  if (!valid || !isProfileChanged.value) {
    if (!isProfileChanged.value) notificationsStore.showInfo("No changes to save in profile.");
    return;
  }
  profileLoading.value = true;
  try {
    await authStore.updateUserProfile({ full_name: profileData.value.displayName });
    originalDisplayName.value = profileData.value.displayName;
  } catch (error) {
    console.error("Error updating profile from SettingsView:", error);
  } finally {
    profileLoading.value = false;
  }
}

async function handlePasswordChange() {
  authStore.clearError();
  const { valid } = await passwordFormRef.value.validate();
  if (!valid) return;
  passwordLoading.value = true;
  try {
    await authStore.changePassword(passwordData.value.newPassword);
    passwordFormRef.value.reset();
  } catch (error) {
    console.error("Error changing password from SettingsView:", error);
    passwordData.value.confirmNewPassword = '';
  } finally {
    passwordLoading.value = false;
  }
}

function applySelectedTheme(newThemeName) {
  themeStore.setTheme(newThemeName);
}

watch(() => themeStore.activeThemeName, (newName) => {
    selectedThemeName.value = newName;
});

// Method for language select component
const setLocale = (newLocale) => {
  if (i18n.availableLocales.includes(newLocale)) {
    i18n.locale.value = newLocale;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('appLanguage', newLocale);
    }
  } else {
    console.warn(`Attempted to set unsupported locale: ${newLocale}`);
  }
};

</script>

<style scoped>
.v-expansion-panel-text {
  background-color: rgba(var(--v-theme-on-surface), 0.02);
}
</style>
