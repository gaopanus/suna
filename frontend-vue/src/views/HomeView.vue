<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <v-img
          :src="logoUrl"
          class="my-3"
          contain
          height="200"
        />
      </v-col>

      <v-col class="mb-4">
        <h1 class="display-2 font-weight-bold mb-3">
          Welcome to Vuetify 3
        </h1>

        <p class="subheading font-weight-regular">
          For help and collaboration with other Vuetify developers,
          <br>please join our online
          <a
            href="https://community.vuetifyjs.com"
            target="_blank"
          >Discord Community</a>
        </p>
      </v-col>

      <v-col
        class="mb-5"
        cols="12"
      >
        <h2 class="headline font-weight-bold mb-3">
          What's next?
        </h2>

        <v-row justify="center">
          <a
            v-for="(next, i) in whatsNext"
            :key="i"
            :href="next.href"
            class="subheading mx-3"
            target="_blank"
          >
            {{ next.text }}
          </a>
        </v-row>
      </v-col>

      <v-col
        class="mb-5"
        cols="12"
      >
        <h2 class="headline font-weight-bold mb-3">
          Important Links
        </h2>

        <v-row justify="center">
          <a
            v-for="(link, i) in importantLinks"
            :key="i"
            :href="link.href"
            class="subheading mx-3"
            target="_blank"
          >
            {{ link.text }}
          </a>
        </v-row>
      </v-col>

      <v-col
        class="mb-5"
        cols="12"
      >
        <h2 class="headline font-weight-bold mb-3">
          Ecosystem
        </h2>

        <v-row justify="center">
          <a
            v-for="(eco, i) in ecosystem"
            :key="i"
            :href="eco.href"
            class="subheading mx-3"
            target="_blank"
          >
            {{ eco.text }}
          </a>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';

// You might want to host the Vuetify logo in src/assets or use a CDN link
const logoUrl = ref('https://cdn.vuetifyjs.com/images/logos/vuetify-logo-dark.png');

const whatsNext = ref([
  {
    text: 'Explore components',
    href: 'https://vuetifyjs.com/components/all/',
  },
  {
    text: 'Select a layout',
    href: 'https://vuetifyjs.com/getting-started/pre-made-layouts/',
  },
  {
    text: 'Frequently Asked Questions',
    href: 'https://vuetifyjs.com/getting-started/frequently-asked-questions/',
  },
]);

const importantLinks = ref([
  {
    text: 'Documentation',
    href: 'https://vuetifyjs.com/',
  },
  {
    text: 'Discord',
    href: 'https://community.vuetifyjs.com/',
  },
  {
    text: 'Made with Vuetify',
    href: 'https://madewithvuejs.com/vuetify',
  },
  {
    text: 'Twitter',
    href: 'https://twitter.com/vuetifyjs',
  },
  {
    text: 'Articles',
    href: 'https://medium.com/vuetify',
  },
]);

const ecosystem = ref([
  {
    text: 'vue-router',
    href: 'https://router.vuejs.org/',
  },
  {
    text: 'pinia',
    href: 'https://pinia.vuejs.org/',
  },
  {
    text: 'vue-devtools',
    href: 'https://github.com/vuejs/vue-devtools',
  },
  {
    text: 'vite',
    href: 'https://vitejs.dev/',
  },
  {
    text: 'awesome-vue',
    href: 'https://github.com/vuejs/awesome-vue',
  },
]);
</script>

<style scoped>
.subheading {
  text-decoration: none;
  color: inherit;
}
.subheading:hover {
  text-decoration: underline;
}
</style>
