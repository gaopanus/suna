<template>
  <v-responsive class="message-list-container fill-height" ref="messageListContainerRef">
    <v-container fluid class="pa-0 fill-height">
      <div v-if="isLoadingMessages && messages.length === 0" class="text-center pa-4 d-flex flex-column justify-center align-center fill-height">
        <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
        <p class="mt-2 text-grey">Loading messages...</p>
      </div>
      <div v-else-if="messages.length === 0 && !isStreamingInProgress" class="text-center pa-4 d-flex flex-column justify-center align-center fill-height text-grey">
        <v-icon size="x-large" class="mb-2">mdi-message-outline</v-icon>
        <p>No messages yet. Start the conversation!</p>
      </div>
      <div v-else class="message-list-scrollable" ref="scrollableDivRef">
        <MessageItem
          v-for="message in messages"
          :key="message.message_id || message.temp_id"
          :message="message"
        />
        <!-- Placeholder for actively streaming assistant message or tool call -->
        <div
          v-if="isStreamingInProgress || currentToolCallInfo"
          class="pa-3 ma-2 message-item message-assistant"
          :key="currentThreadStore.currentAssistantMessageId || 'streaming-placeholder'"
        >
           <v-card
              variant="elevated"
              color="grey-lighten-4"
              class="d-inline-block assistant-streaming-card"
              max-width="85%"
              elevation="2"
            >
            <v-card-subtitle class="pb-1 text-caption">
              <strong>Assistant</strong>
              <!-- Timestamp could be dynamic or omitted for streaming part -->
            </v-card-subtitle>
            <v-card-text class="py-2">
              <!-- Display current tool call if active -->
              <div v-if="currentToolCallInfo" class="mb-1">
                <v-chip color="blue-grey" size="small" prepend-icon="mdi-cogs" label class="mb-1">
                  Using tool: <strong>{{ currentToolCallInfo.name }}</strong>
                </v-chip>
                <pre v-if="currentToolCallInfo.arguments" class="tool-arguments text-caption pa-2 bg-grey-lighten-3 rounded">{{ formatToolArguments(currentToolCallInfo.arguments) }}</pre>
              </div>
              <!-- Display streaming text if tool is not active or after tool arguments -->
              <div v-if="streamingTextContent" v-html="renderMarkdown(streamingTextContent)"></div>
              <!-- Display thinking indicator if no text/tool call yet but streaming -->
              <div v-if="isThinking && !streamingTextContent && !currentToolCallInfo">
                <v-progress-circular indeterminate size="20" color="primary" class="mr-2"></v-progress-circular>
                <span class="text-caption">Thinking...</span>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </div>
    </v-container>
  </v-responsive>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue';
import MessageItem from './MessageItem.vue';
import { useCurrentThreadStore } from '@/store/currentThread';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

const props = defineProps({
  messages: {
    type: Array,
    required: true,
    default: () => []
  },
  isLoadingMessages: {
    type: Boolean,
    default: false
  }
});

const scrollableDivRef = ref(null);
const currentThreadStore = useCurrentThreadStore();

// More specific computed properties for clarity in template
const isStreamingInProgress = computed(() =>
    ['connecting', 'streaming', 'thinking', 'tool_output_pending'].includes(currentThreadStore.agentRunStatus) ||
    (currentThreadStore.agentRunStatus === 'tool_started' && !currentThreadStore.currentToolCall) // Covers brief moment before tool_call appears
);

const isThinking = computed(() => currentThreadStore.agentRunStatus === 'thinking' || currentThreadStore.agentRunStatus === 'connecting');

const currentToolCallInfo = computed(() => currentThreadStore.currentToolCall);

// Use currentAssistantMessage from the store for live updates
const streamingTextContent = computed(() => currentThreadStore.currentAssistantMessage);

const scrollToBottom = () => {
  nextTick(() => {
    const container = scrollableDivRef.value;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  });
};

// Watch main messages prop
watch(() => props.messages, () => {
  scrollToBottom();
}, { deep: true, immediate: true });

// Watch for changes in streaming content or status to trigger scroll
watch(streamingTextContent, () => { scrollToBottom(); });
watch(currentToolCallInfo, () => { scrollToBottom(); }, { deep: true });
watch(isStreamingInProgress, (newValue) => { if (newValue) scrollToBottom(); });


const renderMarkdown = (text) => {
  if (!text) return '';
  const dirty = marked.parse(text);
  // Ensure DOMPurify is configured to allow styles if needed, or use Vuetify typography classes
  return DOMPurify.sanitize(dirty);
};

const formatToolArguments = (args) => {
  if (typeof args === 'string') {
    try {
      const parsed = JSON.parse(args);
      return JSON.stringify(parsed, null, 2);
    } catch (e) { return args; } // Return as is if not valid JSON string
  }
  return JSON.stringify(args, null, 2); // Pretty print if already object
};

defineExpose({
  scrollToBottom,
  scrollableDivRef // Expose for parent if needed for complex scroll logic
});
</script>

<style scoped>
.message-list-container {
  overflow-y: hidden;
}
.message-list-scrollable {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 8px 0; /* Add some padding top/bottom for scrollable area */
}
.tool-arguments {
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
  font-size: 0.8rem;
  max-height: 150px; /* Limit height of args display */
  overflow-y: auto;
}
.assistant-streaming-card .v-card-text {
    min-height: 40px; /* Ensure some height for the thinking indicator */
}

/* Styling for markdown content if needed */
:deep(.message-list-scrollable .message-content p:last-child) {
  margin-bottom: 0;
}
</style>
