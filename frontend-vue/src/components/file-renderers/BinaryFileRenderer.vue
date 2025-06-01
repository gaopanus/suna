<template>
  <v-card flat class="binary-file-renderer my-2" :variant="cardVariant" :border="border">
    <v-toolbar density="compact" color="grey-lighten-4" flat>
      <v-icon start class="ml-2">{{ fileIcon }}</v-icon>
      <v-toolbar-title class="text-caption font-weight-medium text-truncate" :title="fileName">
        {{ fileName || 'Unknown File' }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        v-if="fileUrl"
        :href="fileUrl"
        target="_blank"
        :download="fileName || true"
        icon="mdi-download"
        variant="text"
        size="small"
        title="Download file"
      ></v-btn>
    </v-toolbar>
    <v-divider></v-divider>
    <v-card-text class="pa-3">
      <div class="mb-2">
        <p v-if="fileTypeDetected" class="text-caption">Detected Type: <v-chip size="x-small" label>{{ fileTypeDetected }}</v-chip></p>
        <p v-if="fileSizeFormatted" class="text-caption">Size: {{ fileSizeFormatted }}</p>
        <p v-if="!fileUrl" class="text-caption text-error">Download URL not available.</p>
      </div>

      <div v-if="isLoadingHex" class="text-center my-3">
          <v-progress-circular indeterminate size="24" color="primary"></v-progress-circular>
          <p class="text-caption mt-1">Loading preview...</p>
      </div>
      <div v-else-if="hexPreview && showHexPreview" class="hex-preview-container mt-2">
        <h4 class="text-overline">Hex Preview (first {{ previewByteLimit }} bytes)</h4>
        <pre class="hex-dump pa-2 bg-grey-lighten-3 rounded text-caption">{{ hexPreview }}</pre>
      </div>
      <div v-else-if="showHexPreview && !error && !isLoadingHex" class="text-caption text-grey">
          Hex preview not available or file is empty.
      </div>
       <div v-if="error" class="mt-2">
          <v-alert type="warning" density="compact" variant="tonal">Could not load hex preview: {{ error }}</v-alert>
      </div>


    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import { formatFileSize } from '@/utils/formatters'; // Assuming this helper exists

const props = defineProps({
  fileName: {
    type: String,
    required: true,
  },
  fileUrl: { // URL to download the full file, and to fetch preview from
    type: String,
    default: null,
  },
  mimeType: { // Explicitly passed MIME type
    type: String,
    default: '',
  },
  fileSize: { // In bytes
    type: Number,
    default: null,
  },
  arrayBufferContent: { // Direct ArrayBuffer content for preview
    type: ArrayBuffer,
    default: null,
  },
  showHexPreview: { // Whether to attempt showing hex preview
    type: Boolean,
    default: false, // Disabled by default as it involves fetching
  },
  previewByteLimit: { // How many bytes to fetch for hex preview
      type: Number,
      default: 256, // Show first 256 bytes
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

const hexPreview = ref('');
const isLoadingHex = ref(false);
const error = ref(null);

const getIconForMimeOrExtension = (mime, fileName) => {
  const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
  const mimeType = mime.toLowerCase();

  if (mimeType.startsWith('image/')) return 'mdi-file-image-outline';
  if (mimeType === 'application/pdf') return 'mdi-file-pdf-box';
  if (mimeType.startsWith('text/')) return 'mdi-file-document-outline';
  if (mimeType.startsWith('audio/')) return 'mdi-file-music-outline';
  if (mimeType.startsWith('video/')) return 'mdi-file-video-outline';
  if (mimeType === 'application/zip' || ['zip', 'rar', 'tar', 'gz'].includes(ext)) return 'mdi-folder-zip-outline';
  if (['doc', 'docx'].includes(ext)) return 'mdi-file-word-outline';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'mdi-file-excel-outline';
  if (['ppt', 'pptx'].includes(ext)) return 'mdi-file-powerpoint-outline';
  if (['json', 'xml', 'html', 'js', 'css', 'py', 'java', 'c', 'cpp', 'cs', 'rb', 'php', 'sh'].includes(ext)) return 'mdi-file-code-outline';

  return 'mdi-file-question-outline'; // Generic binary/unknown
};

const fileIcon = computed(() => {
  return getIconForMimeOrExtension(props.mimeType, props.fileName);
});

const fileTypeDetected = computed(() => {
    if (props.mimeType) return props.mimeType;
    const ext = props.fileName.includes('.') ? props.fileName.split('.').pop().toLowerCase() : null;
    if (ext) return `.${ext} file`;
    return 'Unknown type';
});

const fileSizeFormatted = computed(() => {
    return formatFileSize(props.fileSize);
});

function arrayBufferToHexString(buffer) {
  if (!buffer) return '';
  const byteArray = new Uint8Array(buffer);
  let hexString = '';
  let asciiString = '';
  const bytesPerLine = 16;

  for (let i = 0; i < byteArray.length; i++) {
    // Add offset
    if (i % bytesPerLine === 0) {
      hexString += i.toString(16).padStart(8, '0') + '  ';
    }

    // Add hex byte
    hexString += byteArray[i].toString(16).padStart(2, '0').toUpperCase() + ' ';

    // Add ASCII character or '.' for non-printable
    const char = String.fromCharCode(byteArray[i]);
    asciiString += (byteArray[i] >= 32 && byteArray[i] <= 126) ? char : '.';

    // Add ASCII string at the end of the line or if it's the last byte
    if ((i + 1) % bytesPerLine === 0 || i === byteArray.length - 1) {
      // Pad remaining hex bytes if last line is not full
      if (i === byteArray.length - 1 && (i + 1) % bytesPerLine !== 0) {
        const remaining = bytesPerLine - ((i + 1) % bytesPerLine);
        hexString += '   '.repeat(remaining); // 3 spaces per byte (2 hex + 1 space)
      }
      hexString += ' |' + asciiString.padEnd(bytesPerLine, ' ') + '|\n';
      asciiString = '';
    }
  }
  return hexString.trim();
}


async function fetchAndDisplayHexPreview() {
    if (!props.fileUrl || !props.showHexPreview) {
        hexPreview.value = '';
        return;
    }
    isLoadingHex.value = true;
    error.value = null;
    try {
        const response = await fetch(props.fileUrl, {
            headers: {
                'Range': `bytes=0-${props.previewByteLimit - 1}`
            }
        });
        if (!response.ok) {
            if (response.status === 416) { // Range Not Satisfiable (e.g. file smaller than range)
                 const fullResponse = await fetch(props.fileUrl); // Fetch the whole small file
                 if(!fullResponse.ok) throw new Error(`HTTP error ${fullResponse.status}`);
                 const buffer = await fullResponse.arrayBuffer();
                 hexPreview.value = arrayBufferToHexString(buffer);
            } else {
                throw new Error(`HTTP error ${response.status}`);
            }
        } else {
            const buffer = await response.arrayBuffer();
            hexPreview.value = arrayBufferToHexString(buffer);
        }
    } catch (err) {
        console.error("Error fetching hex preview:", err);
        error.value = err.message;
        hexPreview.value = '';
    } finally {
        isLoadingHex.value = false;
    }
}

watch(() => props.arrayBufferContent, (newBuffer) => {
    if (newBuffer && props.showHexPreview) {
        hexPreview.value = arrayBufferToHexString(newBuffer.slice(0, props.previewByteLimit));
        isLoadingHex.value = false;
        error.value = null;
    } else if (!props.fileUrl && props.showHexPreview) {
         hexPreview.value = ''; // Clear if no buffer and no URL
    }
}, { immediate: true });

watch(() => props.fileUrl, (newUrl) => {
    if (newUrl && !props.arrayBufferContent && props.showHexPreview) {
        fetchAndDisplayHexPreview();
    } else if (!newUrl && !props.arrayBufferContent) {
        hexPreview.value = ''; // Clear if URL is removed and no buffer
    }
}, { immediate: true });

watch(() => props.showHexPreview, (shouldShow) => {
    if (shouldShow && !hexPreview.value && !isLoadingHex.value) {
        if (props.arrayBufferContent) {
             hexPreview.value = arrayBufferToHexString(props.arrayBufferContent.slice(0, props.previewByteLimit));
        } else if (props.fileUrl) {
            fetchAndDisplayHexPreview();
        }
    }
});


onMounted(() => {
    if (props.showHexPreview) {
        if (props.arrayBufferContent) {
            hexPreview.value = arrayBufferToHexString(props.arrayBufferContent.slice(0, props.previewByteLimit));
        } else if (props.fileUrl) {
            fetchAndDisplayHexPreview();
        }
    }
});

</script>

<style scoped>
.binary-file-renderer {
  /* border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); */
}
.hex-preview-container .hex-dump {
  white-space: pre; /* Preserve exact formatting from hex dump */
  font-family: monospace;
  font-size: 0.8em; /* Smaller for dense info */
  line-height: 1.3;
  max-height: 200px; /* Limit hex preview height */
  overflow-y: auto;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
