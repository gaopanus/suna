<template>
  <v-card flat class="markdown-file-renderer my-2" :variant="cardVariant" :border="border">
    <v-toolbar density="compact" color="grey-lighten-4" flat v-if="effectiveFileName">
      <v-toolbar-title class="text-caption font-weight-medium">
        {{ effectiveFileName }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        v-if="src || content"
        icon="mdi-download"
        variant="text"
        size="small"
        @click="downloadMarkdownFile"
        title="Download Markdown file"
      ></v-btn>
    </v-toolbar>
    <v-divider v-if="effectiveFileName"></v-divider>

    <div v-if="isLoading" class="pa-4 text-center">
      <v-progress-circular indeterminate color="primary" class="my-3"></v-progress-circular>
      <p>Loading Markdown content...</p>
    </div>
    <div v-else-if="error" class="pa-4">
      <v-alert type="error" density="compact">
        Error loading Markdown: {{ error }}
      </v-alert>
    </div>
    <v-card-text v-else-if="markdownContent" class="pa-3" :style="{ maxHeight: maxHeight, overflowY: 'auto' }">
      <MarkdownDisplay :markdown="markdownContent" />
    </v-card-text>
    <div v-else class="pa-4 text-center text-grey">
      No Markdown content to display.
    </div>
  </v-card>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import MarkdownDisplay from '@/components/common/MarkdownDisplay.vue'; // Import existing component

const props = defineProps({
  src: { // URL to fetch the Markdown from
    type: String,
    default: null,
  },
  content: { // Direct Markdown string content
    type: String,
    default: null,
  },
  fileName: { // Optional, used for display and download
    type: String,
    default: 'document.md',
  },
  maxHeight: {
    type: String,
    default: '600px' // Max height for the scrollable content area
  },
  cardVariant: {
    type: String,
    default: 'outlined'
  },
  border: {
    type: [Boolean, String],
    default: true,
  }
});

const markdownContent = ref('');
const isLoading = ref(false);
const error = ref(null);

const effectiveFileName = computed(() => props.fileName || (props.src ? props.src.split('/').pop() : 'document.md'));

async function fetchMarkdownContent() {
  if (!props.src) return;
  isLoading.value = true;
  error.value = null;
  try {
    const response = await fetch(props.src);
    if (!response.ok) {
      throw new Error(`Failed to fetch Markdown: ${response.status} ${response.statusText}`);
    }
    markdownContent.value = await response.text();
  } catch (err) {
    console.error('Error fetching Markdown content:', err);
    error.value = err.message;
    markdownContent.value = '';
  } finally {
    isLoading.value = false;
  }
}

watch(() => props.src, (newSrc) => {
  if (newSrc) {
    fetchMarkdownContent();
  } else if (props.content) {
    markdownContent.value = props.content;
    error.value = null;
  } else {
      markdownContent.value = '';
      error.value = null;
  }
}, { immediate: true });

watch(() => props.content, (newContent) => {
  if (!props.src) { // Only update from content prop if src is not active
    markdownContent.value = newContent || '';
    error.value = null;
    isLoading.value = false;
  }
});

onMounted(() => {
  if (props.src) {
    // fetchMarkdownContent is called by watcher
  } else if (props.content) {
    markdownContent.value = props.content;
  }
});

function downloadMarkdownFile() {
  const contentToDownload = markdownContent.value;
  if (!contentToDownload) {
    alert('No Markdown content to download.');
    return;
  }
  const blob = new Blob([contentToDownload], { type: 'text/markdown;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = effectiveFileName.value;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
</script>

<style scoped>
.markdown-file-renderer {
  /* border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); */
}
/* Styles for MarkdownDisplay are handled within its own component or globally */
</style>
