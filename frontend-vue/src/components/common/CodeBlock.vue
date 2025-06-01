<template>
  <v-card flat class="code-block-container my-2" :variant="variant" :border="border">
    <v-toolbar density="compact" color="grey-lighten-3" flat class="code-block-toolbar">
      <v-toolbar-title class="text-caption font-weight-medium">
        {{ languageDisplay }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        icon="mdi-content-copy"
        size="small"
        variant="text"
        @click="handleCopyCode"
        title="Copy code"
      >
      </v-btn>
    </v-toolbar>
    <v-divider></v-divider>
    <v-card-text class="pa-0">
      <pre class="code-block pa-3" :style="{ maxHeight: maxHeight, overflowX: 'auto', overflowY: 'auto' }"><code :class="languageClass">{{ code }}</code></pre>
    </v-card-text>

    <v-snackbar
      v-model="copySuccess"
      timeout="2000"
      color="success"
      location="bottom end"
      variant="tonal"
    >
      Code copied to clipboard!
      <template v-slot:actions>
        <v-btn icon="mdi-close" @click="copySuccess = false" size="small"></v-btn>
      </template>
    </v-snackbar>
     <v-snackbar
      v-model="copyError"
      timeout="3000"
      color="error"
      location="bottom end"
      variant="tonal"
    >
      Failed to copy code.
       <template v-slot:actions>
        <v-btn icon="mdi-close" @click="copyError = false" size="small"></v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { copyToClipboard } from '@/utils/helpers'; // Assuming this helper exists

const props = defineProps({
  code: {
    type: String,
    required: true,
    default: ''
  },
  language: {
    type: String,
    default: 'plaintext' // Default to plaintext if no language specified
  },
  maxHeight: {
    type: String,
    default: '400px' // Default max height before scrolling
  },
  variant: {
    type: String,
    default: 'outlined' // e.g. 'flat', 'outlined', 'tonal'
  },
  border: {
    type: [Boolean, String],
    default: true,
  }
});

const copySuccess = ref(false);
const copyError = ref(false);

const languageClass = computed(() => {
  return props.language ? `language-${props.language}` : 'language-plaintext';
});

const languageDisplay = computed(() => {
    if (!props.language || props.language.toLowerCase() === 'plaintext' || props.language.toLowerCase() === 'text') {
        return 'Code';
    }
    return props.language.charAt(0).toUpperCase() + props.language.slice(1);
});

async function handleCopyCode() {
  try {
    await copyToClipboard(props.code);
    copySuccess.value = true;
    copyError.value = false;
  } catch (err) {
    console.error('Failed to copy code:', err);
    copyError.value = true;
    copySuccess.value = false;
  }
}
</script>

<style scoped>
.code-block-container {
  /* border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); */
  transition: box-shadow 0.2s ease-in-out;
}
.code-block-container:hover {
    /* box-shadow: 0 0 5px rgba(var(--v-border-color), var(--v-border-opacity)); */
}

.code-block-toolbar {
  min-height: 36px !important; /* Adjust to make it smaller */
}

.code-block pre {
  margin: 0; /* Reset default pre margin */
  background-color: rgba(var(--v-theme-on-surface), 0.03); /* Subtle background */
  line-height: 1.6;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  font-size: 0.875rem; /* Slightly smaller for code */
  border-radius: 0 0 inherit inherit; /* Inherit bottom rounding from card */
}

.code-block code {
  display: block; /* Ensure code block takes full width of pre */
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
}

/* Basic theming for common languages if not using a highlighter lib yet */
/* This is very rudimentary. A proper highlighter is recommended. */
:deep(.language-javascript) { color: #d19a66; }
:deep(.language-python) { color: #61afef; }
:deep(.language-json) { color: #abb2bf; } /* Default text color, structure is key */
:deep(.language-bash), :deep(.language-shell) { color: #c678dd; }
:deep(.language-html) { color: #e06c75; }
:deep(.language-css) { color: #98c379; }
</style>
