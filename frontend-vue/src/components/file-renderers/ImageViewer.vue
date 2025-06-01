<template>
  <v-card flat class="image-viewer my-2">
    <v-img
      :src="src"
      :alt="alt || 'Image content'"
      contain
      max-height="400"
      class="rounded"
      aspect-ratio="16/9"
    >
      <template v-slot:placeholder>
        <v-row class="fill-height ma-0" align="center" justify="center">
          <v-progress-circular indeterminate color="grey-lighten-5"></v-progress-circular>
        </v-row>
      </template>
      <template v-slot:error>
         <v-row class="fill-height ma-0" align="center" justify="center" >
            <v-icon color="warning" size="x-large">mdi-image-broken-variant</v-icon>
            <p class="text-caption mt-2">Could not load image.</p>
         </v-row>
      </template>
    </v-img>
    <v-card-subtitle v-if="alt" class="text-center pt-1 text-caption">{{ alt }}</v-card-subtitle>
  </v-card>
</template>

<script setup>
defineProps({
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: 'Displayed image',
  },
});
</script>

<style scoped>
.image-viewer {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
