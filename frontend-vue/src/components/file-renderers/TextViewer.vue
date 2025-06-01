<template>
  <v-card flat class="text-viewer my-2" :loading="isLoading">
    <v-card-title v-if="fileName" class="text-subtitle-2 py-1 d-flex justify-space-between align-center">
      <span>{{ fileName }}</span>
      <v-btn icon="mdi-download" variant="text" size="small" @click="downloadTextFile" title="Download text file"></v-btn>
    </v-card-title>
    <v-divider v-if="fileName"></v-divider>
    <v-card-text>
      <pre class="text-content pa-2" :style="{ maxHeight: maxHeight, overflowY: 'auto' }">{{ contentToDisplay }}</pre>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  content: {
    type: [String, Blob], // Can accept string or Blob
    required: true,
  },
  fileName: {
    type: String,
    default: 'textfile.txt',
  },
  maxHeight: {
    type: String,
    default: '400px' // Default max height before scrolling
  }
});

const isLoading = ref(false);
const textContentFromBlob = ref('');

const contentToDisplay = computed(() => {
    if (typeof props.content === 'string') {
        return props.content;
    } else if (props.content instanceof Blob) {
        // If it's a blob, read it.
        // This is a simplified way; ideally, this read happens once.
        // For now, it will re-read on every access if not handled carefully.
        // A better approach would be to read it in onMounted or a watcher.
        // However, props should ideally be reactive strings or URLs for viewers.
        // This is a fallback.
        readBlobContent();
        return textContentFromBlob.value;
    }
    return 'Invalid content type.';
});

async function readBlobContent() {
    if (props.content instanceof Blob && !textContentFromBlob.value && !isLoading.value) {
        isLoading.value = true;
        try {
            textContentFromBlob.value = await props.content.text();
        } catch (e) {
            console.error("Error reading blob content:", e);
            textContentFromBlob.value = "Error reading file content.";
        } finally {
            isLoading.value = false;
        }
    }
}

// Trigger blob read if content changes to a blob
watch(() => props.content, (newContent) => {
    if (newContent instanceof Blob) {
        textContentFromBlob.value = ''; // Reset for new blob
        readBlobContent();
    }
}, { immediate: true });


function downloadTextFile() {
  const textToDownload = (typeof props.content === 'string') ? props.content : textContentFromBlob.value;
  if (!textToDownload) {
      alert('No content to download.');
      return;
  }
  const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = props.fileName || 'textfile.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
</script>

<style scoped>
.text-viewer {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.text-content {
  white-space: pre-wrap; /* Respects newlines and wraps text */
  word-break: break-all; /* Breaks long words to prevent overflow */
  font-family: monospace;
  font-size: 0.9em;
  background-color: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 4px;
}
</style>
