<template>
  <v-layout class="fill-height chat-view-layout">
    <v-main class="fill-height d-flex flex-column">
      <div class="flex-grow-1 overflow-hidden">
         <MessageList
            :messages="sortedMessages"
            :is-loading-messages="isLoadingMessages"
            ref="messageListRef"
        />
      </div>

      <div v-if="currentThreadStore.streamError" class="pa-2">
        <v-alert
            type="error"
            density="compact"
            closable
            @click:close="currentThreadStore.streamError = null"
            class="mx-2 mb-1"
        >
          {{ currentThreadStore.streamError.message || 'An error occurred during streaming.' }}
        </v-alert>
      </div>

      <ChatInput
        @sendMessage="handleSendMessage"
        :is-sending-message="isSendingMessage"
        :disabled="currentThreadStore.hasActiveAgentRun"
      />
    </v-main>

    <!-- Optional Right Sidebar for Status -->
    <v-navigation-drawer
        v-if="showDebugSidebar"
        location="right"
        permanent
        width="280"
        class="pa-2"
        style="font-size: 0.8rem;"
    >
        <p class="font-weight-bold">Debug/Status Panel</p>
        <v-divider class="my-2"></v-divider>
        <p>Project ID: <span class="text-caption">{{ projectId }}</span></p>
        <p>Thread ID: <span class="text-caption">{{ threadId }}</span></p>
        <p>Agent Run ID: <span class="text-caption">{{ currentThreadStore.agentRunId || 'N/A' }}</span></p>
        <v-divider class="my-2"></v-divider>
        <p>Agent Status: <v-chip size="small" :color="agentStatusColor" label>{{ currentThreadStore.agentRunStatus }}</v-chip></p>

        <div v-if="currentThreadStore.currentToolCall" class="mt-2">
            <p class="font-weight-medium">Tool in Use:</p>
            <v-chip color="blue-grey" size="x-small" label class="mb-1">
              {{ currentThreadStore.currentToolCall.name }}
            </v-chip>
            <pre v-if="currentThreadStore.currentToolCall.arguments" class="tool-arguments-debug text-caption pa-1 bg-grey-lighten-3 rounded">{{ formatToolArguments(currentThreadStore.currentToolCall.arguments) }}</pre>
        </div>
         <div v-if="currentThreadStore.isStreaming" class="mt-2">
            <p class="font-weight-medium">Streaming...</p>
        </div>
        <div v-if="currentThreadStore.currentAssistantMessageId" class="mt-2">
            <p class="font-weight-medium">Building Msg ID:</p>
            <p class="text-caption">{{ currentThreadStore.currentAssistantMessageId }}</p>
            <p class="font-weight-medium mt-1">Content:</p>
            <p class="text-caption text-truncate" style="max-height: 60px; overflow: hidden;">{{ currentThreadStore.currentAssistantMessage }}</p>
        </div>
    </v-navigation-drawer>

  </v-layout>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCurrentThreadStore } from '@/store/currentThread';
import MessageList from '@/components/chat/MessageList.vue';
import ChatInput from '@/components/chat/ChatInput.vue';

const route = useRoute();
const router = useRouter(); // If needed for navigation from here
const currentThreadStore = useCurrentThreadStore();

const projectId = ref(route.params.projectId);
const threadId = ref(route.params.threadId);
const showDebugSidebar = ref(true); // Toggle for dev purposes

const messageListRef = ref(null);

// Computed properties from the store
const sortedMessages = computed(() => currentThreadStore.sortedMessages);
const isLoadingMessages = computed(() => currentThreadStore.isLoadingMessages);
const isSendingMessage = computed(() => currentThreadStore.isSendingMessage);

const agentStatusColor = computed(() => {
    switch(currentThreadStore.agentRunStatus) {
        case 'connecting': return 'yellow-darken-2';
        case 'streaming': case 'thinking': return 'blue';
        case 'tool_started': case 'tool_output_pending': return 'orange-darken-1';
        case 'completed': return 'green';
        case 'error': return 'red';
        case 'stopped': return 'grey-darken-1';
        default: return 'grey';
    }
});

const formatToolArguments = (args) => {
  if (typeof args === 'string') {
    try {
      const parsed = JSON.parse(args);
      return JSON.stringify(parsed, null, 2);
    } catch (e) { return args; }
  }
  return JSON.stringify(args, null, 2);
};


onMounted(async () => {
  await currentThreadStore.initializeThread(threadId.value);
  scrollToBottom(); // Initial scroll
});

onUnmounted(() => {
  currentThreadStore.stopAgentStream(); // Ensure stream is closed when view is left
});

watch(() => route.params.threadId, async (newThreadId) => {
  if (newThreadId && newThreadId !== threadId.value) {
    threadId.value = newThreadId;
    projectId.value = route.params.projectId;
    await currentThreadStore.initializeThread(newThreadId);
     scrollToBottom();
  }
});

const handleSendMessage = async (messageContent) => {
  await currentThreadStore.addUserMessage(messageContent);
  // Agent run is now triggered within addUserMessage after successful save.
  // SSE connection will be established by startAgentStream called from there.
};

const scrollToBottom = () => {
    nextTick(() => {
        if (messageListRef.value) {
            messageListRef.value.scrollToBottom();
        }
    });
};

// Watch for new messages or agent activity to scroll
watch(sortedMessages, () => {
    scrollToBottom();
}, { deep: true });

// More granular watch for streaming updates
watch(() => currentThreadStore.currentAssistantMessage, () => {
    scrollToBottom();
});
watch(() => currentThreadStore.currentToolCall, () => {
    scrollToBottom();
}, { deep: true });

watch(() => currentThreadStore.agentRunStatus, (newStatus) => {
    // console.log('ChatView: Agent run status changed to ->', newStatus);
    if (newStatus === 'streaming' || newStatus === 'thinking' || newStatus === 'tool_started') {
        scrollToBottom();
    }
    if (newStatus === 'error' && currentThreadStore.streamError) {
        // Error is already shown by v-alert, additional global toast can be added here if desired
        // e.g., toast.error(currentThreadStore.streamError.message);
    }
});

</script>

<style scoped>
.chat-view-layout {
  /* Assuming DefaultLayout provides the app bar space */
  height: calc(100vh - 64px); /* Adjust if your app bar height is different */
}

.flex-grow-1 {
  flex-grow: 1;
}

.overflow-hidden {
  overflow: hidden;
}
.tool-arguments-debug {
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 100px; /* For debug panel */
  overflow-y: auto;
}
</style>
