<template>
  <v-card flat class="default-file-renderer my-2 pa-3">
    <v-row align="center" no-gutters>
      <v-col cols="auto" class="mr-3">
        <v-icon size="large" color="grey-darken-1">{{ fileIcon }}</v-icon>
      </v-col>
      <v-col>
        <div class="text-subtitle-1 font-weight-medium text-truncate" :title="fileName">
          {{ fileName || 'Unknown File' }}
        </div>
        <div v-if="fileSize" class="text-caption text-grey">
          Size: {{ formatFileSize(fileSize) }}
        </div>
      </v-col>
      <v-col cols="auto" class="ml-2">
        <v-btn
          v-if="fileUrl"
          :href="fileUrl"
          target="_blank"
          :download="fileName || true"
          color="primary"
          variant="tonal"
          size="small"
          prepend-icon="mdi-download"
        >
          Download
        </v-btn>
        <v-chip v-else color="grey" size="small" label>No URL</v-chip>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  fileName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: false, // URL might not always be available directly
    default: null,
  },
  fileType: { // Optional, to determine icon
    type: String,
    default: '',
  },
  fileSize: { // Optional, in bytes
    type: Number,
    default: null,
  }
});

const getIconForFileType = (fileNameOrType) => {
  if (!fileNameOrType) return 'mdi-file-question-outline';
  const extension = fileNameOrType.includes('.') ? fileNameOrType.split('.').pop().toLowerCase() : fileNameOrType.toLowerCase();

  if (['zip', 'rar', 'tar', 'gz'].includes(extension)) return 'mdi-folder-zip-outline';
  if (['doc', 'docx'].includes(extension)) return 'mdi-file-word-outline';
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'mdi-file-excel-outline';
  if (['ppt', 'pptx'].includes(extension)) return 'mdi-file-powerpoint-outline';
  if (['mp3', 'wav', 'ogg'].includes(extension)) return 'mdi-file-music-outline';
  if (['mp4', 'avi', 'mov', 'mkv'].includes(extension)) return 'mdi-file-video-outline';
  if (['json', 'xml', 'html', 'js', 'css', 'py', 'java'].includes(extension)) return 'mdi-file-code-outline';
  // No specific icon for image, pdf, text as they have dedicated viewers.
  // But if they reach here, provide a generic one.
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) return 'mdi-file-image-outline';
  if (extension === 'pdf') return 'mdi-file-pdf-box';
  if (['txt', 'md', 'log'].includes(extension)) return 'mdi-file-document-outline';

  return 'mdi-file-outline'; // Generic file icon
};

const fileIcon = computed(() => {
  return getIconForFileType(props.fileType || props.fileName);
});

const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined) return '';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

</script>

<style scoped>
.default-file-renderer {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.text-truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
