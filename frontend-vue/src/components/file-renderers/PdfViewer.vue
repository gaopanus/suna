<template>
  <v-card flat class="pdf-viewer my-2">
    <v-card-title v-if="fileName" class="text-subtitle-2 py-1 d-flex justify-space-between align-center">
      <span>{{ fileName }}</span>
       <v-btn :href="src" target="_blank" download icon="mdi-download" variant="text" size="small" title="Download PDF"></v-btn>
    </v-card-title>
     <v-divider v-if="fileName"></v-divider>
    <v-responsive :aspect-ratio="16/9" :height="viewerHeight">
      <iframe
        v-if="src"
        :src="srcForEmbed"
        type="application/pdf"
        width="100%"
        height="100%"
        frameborder="0"
        title="PDF Viewer"
      >
        <p class="pa-4 text-center text-grey">
          Your browser does not support embedded PDFs.
          You can <a :href="src" target="_blank" download>download the PDF</a> to view it.
        </p>
      </iframe>
      <div v-else class="pa-4 text-center text-grey">
        No PDF source provided.
      </div>
    </v-responsive>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    default: 'document.pdf',
  },
  viewerHeight: {
    type: [String, Number],
    default: '500px', // Default height for the iframe
  }
});

// Some PDF viewers might block rendering if the src is from a different origin and not just a direct link.
// Adding #toolbar=0 can sometimes help hide the default PDF viewer toolbar for a cleaner embed.
// However, this is not universally supported and depends on the browser's PDF plugin.
const srcForEmbed = computed(() => {
    if (!props.src) return '';
    // Check if it's a data URL (already has # or other params)
    if (props.src.startsWith('data:')) {
        return props.src;
    }
    // For external URLs, try adding #toolbar=0 (might not always work)
    // return `${props.src}#toolbar=0&navpanes=0&scrollbar=0`;
    return props.src; // Keep it simple for now
});

</script>

<style scoped>
.pdf-viewer {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden; /* To contain the iframe */
}
iframe {
  display: block; /* Remove potential extra space below iframe */
}
</style>
