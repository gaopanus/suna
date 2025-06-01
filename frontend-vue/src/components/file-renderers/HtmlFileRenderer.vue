<template>
  <v-card flat class="html-file-renderer my-2" :variant="cardVariant" :border="border">
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
        @click="downloadHtmlFile"
        title="Download HTML file"
      ></v-btn>
       <v-tooltip location="bottom" text="Open HTML in new tab (sandboxed if possible)">
        <template v-slot:activator="{ props: tooltipProps }">
            <v-btn
                v-if="src || content"
                v-bind="tooltipProps"
                icon="mdi-open-in-new"
                variant="text"
                size="small"
                @click="openInNewTab"
                title="Open in new tab"
            ></v-btn>
        </template>
      </v-tooltip>
    </v-toolbar>
    <v-divider v-if="effectiveFileName"></v-divider>

    <div v-if="isLoading" class="pa-4 text-center">
      <v-progress-circular indeterminate color="primary" class="my-3"></v-progress-circular>
      <p>Loading HTML content...</p>
    </div>
    <div v-else-if="error" class="pa-4">
      <v-alert type="error" density="compact">
        Error loading HTML: {{ error }}
      </v-alert>
    </div>
    <v-card-text v-else-if="sanitizedHtmlContent" class="html-content-display pa-3" :style="{ maxHeight: maxHeight, overflowY: 'auto' }">
      <!-- Render sanitized HTML directly -->
      <div v-html="sanitizedHtmlContent"></div>

      <!-- Alternative: iframe for better isolation (styling is harder) -->
      <!--
      <iframe
        v-if="useIframe"
        :srcdoc="sanitizedHtmlContent"
        frameborder="0"
        width="100%"
        :style="{ height: maxHeight }"
        sandbox="allow-scripts allow-same-origin" Allow minimal scripts if necessary, but be cautious
      ></iframe>
      -->
    </v-card-text>
    <div v-else class="pa-4 text-center text-grey">
      No HTML content to display.
    </div>
  </v-card>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import DOMPurify from 'dompurify';

const props = defineProps({
  src: { // URL to fetch the HTML from
    type: String,
    default: null,
  },
  content: { // Direct HTML string content
    type: String,
    default: null,
  },
  fileName: { // Optional, used for display and download
    type: String,
    default: 'document.html',
  },
  maxHeight: {
    type: String,
    default: '500px' // Max height for the scrollable content area
  },
  cardVariant: {
    type: String,
    default: 'outlined'
  },
  border: {
    type: [Boolean, String],
    default: true,
  },
  // useIframe: { // Prop to switch to iframe rendering if desired
  //   type: Boolean,
  //   default: false
  // }
});

const rawHtmlContent = ref('');
const isLoading = ref(false);
const error = ref(null);

const effectiveFileName = computed(() => props.fileName || (props.src ? props.src.split('/').pop() : 'document.html'));

const sanitizedHtmlContent = computed(() => {
  if (!rawHtmlContent.value) return '';
  // Configure DOMPurify as needed. Default is quite strict.
  // Allow common styling attributes if your HTML relies on them and source is trusted.
  return DOMPurify.sanitize(rawHtmlContent.value, {
    USE_PROFILES: { html: true },
    // ADD_ATTR: ['style', 'target'], // Example: allow style and target attributes
    // FORBID_TAGS: ['script'] // Ensure scripts are forbidden unless explicitly sandboxed and intended
  });
});

async function fetchHtmlContent() {
  if (!props.src) return;
  isLoading.value = true;
  error.value = null;
  try {
    const response = await fetch(props.src);
    if (!response.ok) {
      throw new Error(`Failed to fetch HTML: ${response.status} ${response.statusText}`);
    }
    rawHtmlContent.value = await response.text();
  } catch (err) {
    console.error('Error fetching HTML content:', err);
    error.value = err.message;
    rawHtmlContent.value = '';
  } finally {
    isLoading.value = false;
  }
}

watch(() => props.src, (newSrc) => {
  if (newSrc) {
    fetchHtmlContent();
  } else if (props.content) {
    rawHtmlContent.value = props.content;
    error.value = null;
  } else {
      rawHtmlContent.value = '';
      error.value = null;
  }
}, { immediate: true });

watch(() => props.content, (newContent) => {
  if (!props.src) { // Only update from content prop if src is not active
    rawHtmlContent.value = newContent || '';
    error.value = null;
    isLoading.value = false;
  }
});

onMounted(() => {
  if (props.src) {
    // fetchHtmlContent is called by watcher
  } else if (props.content) {
    rawHtmlContent.value = props.content;
  }
});

function downloadHtmlFile() {
  const contentToDownload = rawHtmlContent.value;
  if (!contentToDownload) {
    alert('No HTML content to download.');
    return;
  }
  const blob = new Blob([contentToDownload], { type: 'text/html;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = effectiveFileName.value;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function openInNewTab() {
    // For security, if it's direct content, create a blob URL.
    // If it's a src URL, it could be opened directly, but blob URL is safer.
    const contentToOpen = rawHtmlContent.value;
    if (!contentToOpen) return;

    const blob = new Blob([sanitizedHtmlContent.value], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    // Open in a new tab. Browser sandboxing applies to blob URLs.
    window.open(url, '_blank');
    // Blob URL will be revoked automatically when the tab is closed or browser is closed
    // For longer-lived direct access, you might not revoke it immediately or handle it differently.
}

</script>

<style scoped>
.html-file-renderer {
  /* border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); */
}
.html-content-display {
  /* Basic styling to ensure content is visible */
  background-color: white; /* Or inherit from theme */
  color: black; /* Or inherit */
}

/* Add any necessary global styles for v-html content if they are not covered by Vuetify */
/* For example, if the HTML relies on specific classes not available globally */
:deep(.html-content-display p) {
  margin-bottom: 1em;
}
:deep(.html-content-display h1) {
  font-size: 1.5em; /* Example */
  margin-bottom: 0.5em;
}
/* etc. */
</style>
