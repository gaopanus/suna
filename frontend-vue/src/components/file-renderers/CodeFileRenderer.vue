<template>
  <v-card flat class="code-file-renderer my-2" :variant="cardVariant" :border="border">
    <v-toolbar density="compact" color="grey-lighten-4" flat v-if="effectiveFileName || language">
      <v-toolbar-title class="text-caption font-weight-medium">
        {{ effectiveFileName || 'Code Snippet' }}
        <v-chip v-if="detectedLanguage" size="x-small" class="ml-2">{{ detectedLanguage }}</v-chip>
      </v-toolbar-title>
      <v-spacer></v-spacer>
       <v-btn
        v-if="src"
        :href="src"
        target="_blank"
        :download="effectiveFileName || true"
        icon="mdi-download"
        variant="text"
        size="small"
        title="Download code file"
      ></v-btn>
    </v-toolbar>
    <v-divider v-if="effectiveFileName || language"></v-divider>

    <div v-if="isLoading" class="pa-4 text-center">
      <v-progress-circular indeterminate color="primary" class="my-3"></v-progress-circular>
      <p>Loading code...</p>
    </div>
    <div v-else-if="error" class="pa-4">
      <v-alert type="error" density="compact">
        Error loading code: {{ error }}
      </v-alert>
    </div>
    <CodeBlock
        v-else-if="codeContent"
        :code="codeContent"
        :language="detectedLanguage"
        :max-height="maxHeight"
        variant="text"
        :border="false"
    />
    <div v-else class="pa-4 text-center text-grey">
        No code content available.
    </div>
  </v-card>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import CodeBlock from '@/components/common/CodeBlock.vue';

const props = defineProps({
  src: { // URL to fetch the code from
    type: String,
    default: null,
  },
  content: { // Direct code content
    type: String,
    default: null,
  },
  fileName: { // Optional, used for display and language detection
    type: String,
    default: '',
  },
  languageHint: { // Optional, direct hint for language if fileName is not reliable
    type: String,
    default: '',
  },
  maxHeight: {
    type: String,
    default: '500px'
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

const codeContent = ref('');
const isLoading = ref(false);
const error = ref(null);

const effectiveFileName = computed(() => props.fileName || (props.src ? props.src.split('/').pop() : ''));

const detectedLanguage = computed(() => {
  if (props.languageHint) return props.languageHint.toLowerCase();
  if (effectiveFileName.value) {
    const ext = effectiveFileName.value.split('.').pop();
    if (ext) {
      const langMap = {
        js: 'javascript', ts: 'typescript', py: 'python', java: 'java',
        c: 'c', cpp: 'cpp', cs: 'csharp', go: 'go', rb: 'ruby',
        php: 'php', html: 'html', css: 'css', scss: 'scss', less: 'less',
        json: 'json', xml: 'xml', yml: 'yaml', yaml: 'yaml', md: 'markdown',
        sh: 'bash', ps1: 'powershell', sql: 'sql',
      };
      return langMap[ext.toLowerCase()] || ext.toLowerCase();
    }
  }
  return 'plaintext';
});

async function fetchCode() {
  if (!props.src) return;
  isLoading.value = true;
  error.value = null;
  try {
    const response = await fetch(props.src);
    if (!response.ok) {
      throw new Error(`Failed to fetch code: ${response.status} ${response.statusText}`);
    }
    codeContent.value = await response.text();
  } catch (err) {
    console.error('Error fetching code content:', err);
    error.value = err.message;
    codeContent.value = ''; // Clear any previous content
  } finally {
    isLoading.value = false;
  }
}

watch(() => props.src, (newSrc) => {
  if (newSrc) {
    fetchCode();
  } else if (props.content) {
    codeContent.value = props.content;
    error.value = null; // Clear error if content is directly provided
  } else {
      codeContent.value = '';
      error.value = null;
  }
}, { immediate: true });

watch(() => props.content, (newContent) => {
  if (!props.src) { // Only update from content prop if src is not active
    codeContent.value = newContent || '';
    error.value = null; // Clear error if content is directly provided
    isLoading.value = false; // Not loading if content is direct
  }
});

onMounted(() Loglevel => {
  if (props.src) {
    // fetchCode is already called by the watcher on src
  } else if (props.content) {
    codeContent.value = props.content;
  }
});

</script>

<style scoped>
.code-file-renderer {
  /* border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); */
}
/* Ensure CodeBlock inside doesn't add extra borders if cardVariant is 'text' */
:deep(.v-card--variant-text .code-block-container) {
    border: none !important;
}
</style>
