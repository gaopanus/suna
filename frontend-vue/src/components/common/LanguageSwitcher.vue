<template>
  <v-menu offset-y>
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props" aria-label="Change language">
        <v-icon>mdi-translate</v-icon>
      </v-btn>
    </template>
    <v-list density="compact">
      <v-list-item
        v-for="availableLocale in availableLocales"
        :key="availableLocale.code"
        @click="setLocale(availableLocale.code)"
        :active="locale === availableLocale.code"
        color="primary"
      >
        <v-list-item-title>{{ availableLocale.name }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

const { locale, t, availableLocales: i18nAvailableLocales } = useI18n();

// Define display names for your locales if needed, or use keys from your locale files
const availableLocales = computed(() => [
  { code: 'en', name: t('english') }, // Assuming 'english' key exists in locale files
  { code: 'fr', name: t('french') }, // Assuming 'french' key exists
  // Add more languages here as you support them
]);

const setLocale = (newLocale) => {
  if (i18nAvailableLocales.includes(newLocale)) {
    locale.value = newLocale;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('appLanguage', newLocale);
    }
    console.log(`Language changed to: ${newLocale}`);
    // You might need to force a re-render or reload for some deep components,
    // but usually Vue's reactivity + vue-i18n handles it.
  } else {
    console.warn(`Attempted to set unsupported locale: ${newLocale}`);
  }
};
</script>

<style scoped>
/* Add any specific styles if needed */
</style>
