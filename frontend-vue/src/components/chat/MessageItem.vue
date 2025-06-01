<template>
  <div :class="['message-item', messageRoleClass, 'pa-3 ma-2']">
    <v-card
      :variant="message.role === 'user' ? 'outlined' : 'elevated'"
      :color="message.role === 'user' ? 'blue-lighten-5' : 'grey-lighten-4'"
      class="d-inline-block message-card"
      max-width="85%"
      :elevation="message.role === 'user' ? 0 : 2"
    >
      <v-card-subtitle class="pb-1 text-caption">
        <strong>{{ senderName }}</strong>
        <span class="text-grey ml-2">{{ formattedTimestamp }}</span>
      </v-card-subtitle>

      <v-card-text class="message-content py-2">
        <!-- Text content -->
        <div v-if="textContent" v-html="renderMarkdown(textContent)" class="text-content-display"></div>

        <!-- File Attachment -->
        <div v-if="fileAttachment && fileAttachment.url" class="file-attachment-display mt-2">
          <ImageViewer
            v-if="isImage(fileAttachment)"
            :src="fileAttachment.url"
            :alt="fileAttachment.name"
          />
          <PdfViewer
            v-else-if="isPdf(fileAttachment)"
            :src="fileAttachment.url"
            :fileName="fileAttachment.name"
          />
          <TextViewer
            v-else-if="isTextFile(fileAttachment) && fileAttachment.content"  // Assuming text content is pre-loaded for TextViewer
            :content="fileAttachment.content"
            :fileName="fileAttachment.name"
          />
           <TextViewer
            v-else-if="isTextFile(fileAttachment) && !fileAttachment.content && textFileContent"
            :content="textFileContent"
            :fileName="fileAttachment.name"
          />
          <DefaultFileRenderer
            v-else
            :fileName="fileAttachment.name"
            :fileUrl="fileAttachment.url"
            :fileType="fileAttachment.type || fileAttachment.name"
            :fileSize="fileAttachment.size"
          />
        </div>

        <!-- Tool Call (Invocation) -->
        <div v-if="parsedContent && parsedContent.role === 'assistant' && parsedContent.status_type === 'tool_started' && parsedContent.name" class="tool-call-info mt-2">
          <v-chip color="blue-grey" size="small" prepend-icon="mdi-cogs" label class="mb-1">
            Using tool: <strong>{{ parsedContent.xml_tag_name || parsedContent.name }}</strong>
          </v-chip>
          <pre v-if="parsedContent.arguments" class="tool-arguments text-caption pa-2 bg-grey-lighten-3 rounded">{{ formatArguments(parsedContent.arguments) }}</pre>
        </div>

        <!-- Tool Result -->
         <div v-if="message.type === 'tool' && parsedContent && parsedContent.tool_name" class="tool-result-info mt-2">
          <v-chip color="green-darken-1" size="small" prepend-icon="mdi-check-circle-outline" label class="mb-1">
            Tool Result: <strong>{{ parsedContent.tool_name }}</strong>
          </v-chip>
          <pre class="tool-arguments text-caption pa-2 bg-grey-lighten-3 rounded">{{ formatToolResult(parsedContent.result) }}</pre>
        </div>

         <!-- Error Display -->
        <div v-if="parsedContent && (parsedContent.type === 'error' || (parsedContent.status === 'error' && parsedContent.message))" class="error-info mt-2">
          <v-chip color="red-darken-1" size="small" prepend-icon="mdi-alert-circle-outline" label class="mb-1">
            Error
          </v-chip>
          <p class="text-caption pa-2 bg-red-lighten-4 rounded">{{ parsedContent.message }}</p>
        </div>

        <!-- Loading/Thinking Indicator (Usually handled by MessageList for streaming one) -->
        <div v-if="parsedContent && parsedContent.type === 'status' && parsedContent.status_type === 'thinking'" class="thinking-info mt-2">
            <v-progress-circular indeterminate size="20" color="primary" class="mr-2"></v-progress-circular>
            <span class="text-caption">Thinking...</span>
        </div>

      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Import File Renderers
import ImageViewer from '@/components/file-renderers/ImageViewer.vue';
import TextViewer from '@/components/file-renderers/TextViewer.vue';
import PdfViewer from '@/components/file-renderers/PdfViewer.vue';
import DefaultFileRenderer from '@/components/file-renderers/DefaultFileRenderer.vue';
// import { getSandboxFileContent } from '@/services/api'; // If fetching text content on demand

const props = defineProps({
  message: {
    type: Object,
    required: true,
  }
});

const textFileContent = ref(null); // For text files that need loading

const senderName = computed(() => {
  if (props.message.role === 'user') return 'You';
  if (props.message.role === 'assistant') return 'Assistant';
  if (props.message.type === 'tool') return 'Tool';
  return 'System';
});

const formattedTimestamp = computed(() => {
  if (!props.message.created_at) return '';
  return new Date(props.message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

const messageRoleClass = computed(() => {
  return `message-${props.message.role || props.message.type}`;
});

// Enhanced parsedContent to extract primary text and file attachment
const parsedContent = computed(() => {
  let content = props.message.content;
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content);
    } catch (e) {
      return { text: content, file: null }; // Treat as simple text if not JSON
    }
  }
  // Standardize: content is an object. Extract text and file.
  // The structure of 'file' might be like: { name: string, url: string, type: string, size?: number, content?: string (for preloaded text) }
  // This depends on how backend structures messages with attachments.
  // For now, assuming content might have a 'text' part and a 'file' part.
  // Or, for agent messages, content.content might be the text.

  if (props.message.role === 'assistant' && content.content && typeof content.content !== 'object') {
     return { text: content.content, file: content.file || null, ...content }; // Use content.content as text
  }
  if (content.role === 'assistant' && content.name && content.arguments) { // Tool invocation
    return { text: null, file: null, role: 'assistant', status_type: 'tool_started', name: content.name, arguments: content.arguments, xml_tag_name: content.xml_tag_name };
  }
  if (props.message.type === 'tool' && content.content) { // Tool result
     try {
        const toolResultData = JSON.parse(content.content);
        return { text: null, file: null, tool_name: toolResultData.name || content.name, result: toolResultData.result || toolResultData };
    } catch(e) {
        return { text: null, file: null, tool_name: content.name || 'Unknown Tool', result: content.content };
    }
  }
   if (props.message.type === 'status' && content.content) {
      return { text: null, file: null, ...content.content };
  }
  // Default case: content is an object, may have 'text' and/or 'file'
  return { text: content.text || content.content, file: content.file || null, ...content };
});

const textContent = computed(() => parsedContent.value?.text);
const fileAttachment = computed(() => parsedContent.value?.file);

// --- File Type Detection ---
const getFileType = (file) => {
  if (!file || (!file.type && !file.name)) return 'unknown';
  const mimeType = file.type || '';
  const fileName = file.name || '';
  const extension = fileName.split('.').pop().toLowerCase();

  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) return 'image';
  if (mimeType === 'application/pdf' || extension === 'pdf') return 'pdf';
  if (mimeType.startsWith('text/') || ['txt', 'md', 'log', 'json', 'xml', 'html', 'css', 'js'].includes(extension)) return 'text';
  return extension || 'unknown'; // Fallback to extension or 'unknown'
};

const isImage = (file) => getFileType(file) === 'image';
const isPdf = (file) => getFileType(file) === 'pdf';
const isTextFile = (file) => getFileType(file) === 'text';


// --- On-demand loading for text files (if content not preloaded) ---
// This is an example if TextViewer itself doesn't handle URL fetching.
// For simplicity, current TextViewer expects string 'content' or a Blob.
// If fileAttachment.url is a sandbox URL, we might need to fetch it.
/*
watch(fileAttachment, async (newFile) => {
  if (newFile && isTextFile(newFile) && newFile.url && !newFile.content && !textFileContent.value) {
    // Assuming a function fetchTextContent(url) exists
    // textFileContent.value = await fetchTextContent(newFile.url);
    // Or, if getSandboxFileContent is adapted for this:
    // textFileContent.value = await getSandboxFileContent(sandboxId, newFile.path_in_sandbox);
    console.log("Need to load text content for:", newFile.name);
  } else if (!newFile) {
    textFileContent.value = null;
  }
}, { immediate: true });
*/


const renderMarkdown = (text) => {
  if (!text) return '';
  const dirty = marked.parse(text);
  return DOMPurify.sanitize(dirty);
};

const formatArguments = (args) => {
  if (typeof args === 'string') {
    try { args = JSON.parse(args); } catch (e) { return args; }
  }
  return JSON.stringify(args, null, 2);
};

const formatToolResult = (result) => {
  if (typeof result === 'object') return JSON.stringify(result, null, 2);
  return result;
};

</script>

<style scoped>
.message-item {
  display: flex;
  width: 100%;
}
.message-user { justify-content: flex-end; }
.message-assistant, .message-tool, .message-status { justify-content: flex-start; }

.message-card {
  border-radius: 12px !important;
}
.message-user .message-card {
  border-bottom-right-radius: 0px !important;
}
.message-assistant .message-card, .message-tool .message-card, .message-status .message-card {
  border-bottom-left-radius: 0px !important;
}


.message-content :deep(p:last-child) { margin-bottom: 0; }
.message-content :deep(pre) {
  white-space: pre-wrap; word-wrap: break-word; background-color: #f0f0f0; /* Slightly darker for contrast */
  padding: 8px; border-radius: 4px; border: 1px solid #e0e0e0; /* Softer border */
  max-height: 300px; overflow-y: auto;
}
.message-content :deep(code) {
  background-color: #e0e0e0; padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace;
}
.message-content :deep(pre) > :deep(code) { background-color: transparent; padding: 0; }

.tool-call-info .tool-arguments,
.tool-result-info .tool-arguments {
  white-space: pre-wrap; word-break: break-all; font-family: monospace; font-size: 0.8rem;
  max-height: 200px; overflow-y: auto;
}
.error-info p { white-space: pre-wrap; word-break: break-all; }

.file-attachment-display {
    border-top: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
    padding-top: 8px; /* Add some padding above the file renderer */
}
.text-content-display { /* Ensure text content also has some padding if there's a file below */
    padding-bottom: v-bind("fileAttachment ? '8px' : '0'");
}
</style>
