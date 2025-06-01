<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card>
          <v-card-title class="text-h5">
            {{ formTitle }}
          </v-card-title>
          <v-card-text>
            <v-form @submit.prevent="submitAgentForm" ref="agentFormRef">
              <v-text-field
                v-model="agentData.name"
                label="Agent Name"
                :rules="[rules.required, rules.minLength(3)]"
                required
                class="mb-3"
              ></v-text-field>

              <v-textarea
                v-model="agentData.description"
                label="Description (Optional)"
                rows="3"
                auto-grow
                class="mb-3"
              ></v-textarea>

              <v-textarea
                v-model="agentData.system_prompt"
                label="System Prompt"
                rows="5"
                auto-grow
                required
                :rules="[rules.required, rules.minLength(10)]"
                placeholder="Define the agent's role, personality, and instructions..."
                class="mb-3"
              ></v-textarea>

              <!-- Basic Tool Selection (Example) -->
              <h3 class="text-subtitle-1 mb-2">Tool Configuration (Basic)</h3>
              <v-checkbox
                v-model="agentData.agentpress_tools.sb_shell_tool.enabled"
                label="Enable Shell Tool"
                density="compact"
              ></v-checkbox>
              <v-checkbox
                v-model="agentData.agentpress_tools.sb_files_tool.enabled"
                label="Enable Files Tool"
                density="compact"
              ></v-checkbox>
               <v-checkbox
                v-model="agentData.agentpress_tools.web_search_tool.enabled"
                label="Enable Web Search Tool"
                density="compact"
              ></v-checkbox>
              <!-- More tools can be added here -->

              <v-divider class="my-4"></v-divider>

              <v-checkbox
                v-model="agentData.is_default"
                label="Set as Default Agent"
                density="compact"
                hint="If checked, this agent will be used by default for new threads."
                persistent-hint
              ></v-checkbox>

              <v-alert v-if="agentStore.agentError && (agentStore.agentError.operation === 'createUserAgent' || agentStore.agentError.operation === 'updateUserAgent')" type="error" density="compact" class="mt-4">
                {{ agentStore.agentError.message }}
              </v-alert>

            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="cancelForm">Cancel</v-btn>
            <v-btn color="primary" @click="submitAgentForm" :loading="agentStore.isSubmitting">
              {{ isEditing ? 'Save Changes' : 'Create Agent' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAgentStore } from '@/store/agentStore';

const route = useRoute();
const router = useRouter();
const agentStore = useAgentStore();

const agentFormRef = ref(null); // Ref for the v-form
const agentId = ref(route.params.agentId || null); // For editing mode

const isEditing = computed(() => !!agentId.value);
const formTitle = computed(() => isEditing.value ? 'Edit Agent' : 'Create New Agent');

// Default structure for agent data, including nested tool config
const defaultAgentData = () => ({
  name: '',
  description: '',
  system_prompt: '',
  agentpress_tools: {
    sb_shell_tool: { enabled: false },
    sb_files_tool: { enabled: false },
    web_search_tool: { enabled: false },
    // Add other tools with default disabled state
  },
  configured_mcps: [],
  is_default: false,
  avatar: null,
  avatar_color: null,
});

const agentData = ref(defaultAgentData());

const rules = {
  required: value => !!value || 'This field is required.',
  minLength: (length) => value => (value && value.length >= length) || `Must be at least ${length} characters.`,
};

onMounted(async () => {
  agentStore.clearError(); // Clear any previous errors
  if (isEditing.value) {
    // If currentAgent in store matches agentId, use it, otherwise fetch
    if (agentStore.currentAgent?.agent_id !== agentId.value) {
        await agentStore.fetchAgentDetails(agentId.value);
    }
    // Watch for currentAgent to be loaded if fetchAgentDetails was called
    // This might be better with a direct await or a loading flag check
  } else {
    agentData.value = defaultAgentData(); // Ensure form is reset for creation
    agentStore.clearCurrentAgent(); // Clear any stale agent details
  }
});

// Watch for changes in currentAgent (e.g., after fetching for edit)
watch(() => agentStore.currentAgent, (current) => {
  if (isEditing.value && current && current.agent_id === agentId.value) {
    // Deep copy to avoid direct mutation and ensure reactivity for nested objects
    agentData.value = JSON.parse(JSON.stringify({
      name: current.name || '',
      description: current.description || '',
      system_prompt: current.system_prompt || '',
      // Ensure agentpress_tools is an object, merge with defaults to show all available tools
      agentpress_tools: {
        ...defaultAgentData().agentpress_tools, // Start with all tools disabled
        ...(current.agentpress_tools || {}) // Override with actual agent config
      },
      configured_mcps: current.configured_mcps || [],
      is_default: current.is_default || false,
      avatar: current.avatar,
      avatar_color: current.avatar_color,
    }));
  } else if (!isEditing.value) {
      agentData.value = defaultAgentData(); // Reset if navigating away from edit or to create
  }
}, { immediate: true, deep: true });


async function submitAgentForm() {
  agentStore.clearError();
  const { valid } = await agentFormRef.value.validate();
  if (!valid) return;

  try {
    if (isEditing.value) {
      await agentStore.updateUserAgent(agentId.value, agentData.value);
      // Optionally navigate back to MyAgents or AgentDetail view
      router.push({ name: 'MyAgents' }); // Or AgentDetail
    } else {
      const newAgent = await agentStore.createUserAgent(agentData.value);
      // Navigate to the new agent's detail page or MyAgents page
      router.push({ name: 'MyAgents' }); // Or AgentDetail with newAgent.agent_id
    }
  } catch (error) {
    console.error(`Failed to ${isEditing.value ? 'update' : 'create'} agent:`, error);
    // Error is already set in the store and displayed by v-alert
  }
}

function cancelForm() {
  router.back(); // Or navigate to a specific route like MyAgents
}
</script>

<style scoped>
/* Add specific styles if needed */
pre { /* For system prompt example or tool config display if added later */
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
}
</style>
