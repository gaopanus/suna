<template>
  <v-container fluid>
    <div v-if="agentStore.isLoadingCurrentAgent && !agent">
      <v-progress-circular indeterminate color="primary" class="d-block mx-auto my-10"></v-progress-circular>
      <p class="text-center">Loading agent details...</p>
    </div>

    <v-alert
        v-else-if="agentStore.agentError && agentStore.agentError.operation === 'fetchAgentDetails' && !agent"
        type="error"
        class="my-4"
        prominent
    >
      <v-row align="center">
        <v-col class="grow">
          Failed to load agent details: {{ agentStore.agentError.message }}
        </v-col>
        <v-col class="shrink">
          <v-btn color="error" variant="outlined" @click="goBack">Go Back</v-btn>
        </v-col>
      </v-row>
    </v-alert>

    <v-card v-else-if="agent" elevation="2">
      <v-img v-if="agent.avatar" :src="agent.avatar" height="200px" cover class="align-end text-white">
         <v-card-title class="text-h4" style="background-color: rgba(0,0,0,0.5);">{{ agent.name }}</v-card-title>
      </v-img>
      <v-card-title v-else class="text-h4 d-flex align-center">
        <v-avatar :color="agent.avatar_color || 'primary'" size="large" class="mr-3">
          <span class="white--text text-h5">{{ agent.name ? agent.name.charAt(0).toUpperCase() : 'A' }}</span>
        </v-avatar>
        {{ agent.name }}
      </v-card-title>

      <v-card-subtitle class="mt-1">
        Agent ID: {{ agent.agent_id }}
        <span v-if="agent.creator_name"> | By: {{ agent.creator_name }}</span>
      </v-card-subtitle>

      <v-card-text>
        <p class="text-body-1 mb-4">{{ agent.description || 'No description provided.' }}</p>

        <v-divider class="my-3"></v-divider>
        <h3 class="text-h6 mb-2">System Prompt:</h3>
        <pre class="system-prompt pa-3 bg-grey-lighten-4 rounded">{{ agent.system_prompt || 'No system prompt defined.' }}</pre>

        <v-divider class="my-3"></v-divider>
        <h3 class="text-h6 mb-2">Configuration:</h3>
        <v-chip-group column>
            <v-chip v-if="agent.is_public" color="green-darken-1" label size="small" prepend-icon="mdi-earth">Public</v-chip>
            <v-chip v-if="agent.is_default" color="blue-darken-1" label size="small" prepend-icon="mdi-star-circle">Default</v-chip>
        </v-chip-group>

        <div v-if="agent.tags && agent.tags.length" class="mt-3">
            <h4 class="text-subtitle-1">Tags:</h4>
            <v-chip v-for="tag in agent.tags" :key="tag" class="mr-2 mt-1" size="small">{{ tag }}</v-chip>
        </div>

        <div v-if="agent.agentpress_tools && Object.keys(agent.agentpress_tools).length" class="mt-3">
            <h4 class="text-subtitle-1">Enabled Tools:</h4>
            <ul>
                <li v-for="(toolConfig, toolName) in agent.agentpress_tools" :key="toolName">
                    <span v-if="toolConfig.enabled">{{ toolName.replace(/_tool$/, '').replace(/_/g, ' ') }}</span>
                </li>
            </ul>
        </div>

        <div v-if="agent.configured_mcps && agent.configured_mcps.length" class="mt-3">
            <h4 class="text-subtitle-1">MCP Servers:</h4>
            <ul>
                <li v-for="(mcp, index) in agent.configured_mcps" :key="index">{{ mcp.name || mcp.url }}</li>
            </ul>
        </div>

      </v-card-text>

      <v-card-actions>
        <v-btn color="grey" @click="goBack">Back</v-btn>
        <v-spacer></v-spacer>
        <!-- Add other actions like 'Use this Agent' or 'Edit' if it's a user agent -->
        <v-btn
            v-if="isUserAgent(agent.agent_id)"
            color="secondary"
            :to="{ name: 'AgentEdit', params: { agentId: agent.agent_id } }"
        >
            Edit Agent
        </v-btn>
         <v-btn
            v-else
            color="primary"
            @click="handleAddToLibrary"
            :loading="agentStore.isSubmitting"
            :disabled="isAlreadyInLibrary(agent.agent_id)"
        >
           {{ isAlreadyInLibrary(agent.agent_id) ? 'Added to Library' : 'Add to My Agents' }}
        </v-btn>
      </v-card-actions>
    </v-card>
    <div v-else-if="!agentStore.isLoadingCurrentAgent && !agentStore.agentError" class="text-center text-grey py-10">
        <p>Agent not found.</p>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAgentStore } from '@/store/agentStore';

const route = useRoute();
const router = useRouter();
const agentStore = useAgentStore();

const agentId = ref(route.params.agentId);
const agent = computed(() => agentStore.loadedAgent);

const isUserAgent = (currentAgentId) => {
    return agentStore.allUserAgents.some(ua => ua.agent_id === currentAgentId);
};

const isAlreadyInLibrary = (marketplaceAgentId) => {
    // This logic assumes that if an agent from marketplace is added, its original ID or name might be used for comparison.
    // This might need adjustment based on how `addAgentToLibrary` works (e.g. if it stores marketplace_original_id)
    return agentStore.allUserAgents.some(ua => ua.marketplace_original_id === marketplaceAgentId || ua.name === agent.value?.name);
};


onMounted(() => {
  // Fetch details if not already loaded or if ID is different
  if (agentStore.currentAgent?.agent_id !== agentId.value) {
    agentStore.fetchAgentDetails(agentId.value);
  }
  // Also fetch user agents if not already available, to check if this agent is already in library
  if(agentStore.userAgents.length === 0) {
      agentStore.fetchUserAgents();
  }
});

watch(() => route.params.agentId, (newId) => {
  if (newId && newId !== agentId.value) {
    agentId.value = newId;
    agentStore.fetchAgentDetails(newId);
  }
});

function goBack() {
  // Go back to previous page or a default (e.g., marketplace or my-agents)
  if (router.getRoutes().find(r => r.name === 'AgentMarketplace') && fromMarketplace.value) { // Need to track 'from'
    router.push({ name: 'AgentMarketplace' });
  } else if (router.getRoutes().find(r => r.name === 'MyAgents') && !fromMarketplace.value) {
    router.push({ name: 'MyAgents' });
  }
   else {
    router.back();
  }
}
// A simple way to track origin, could be more robust with query params
const fromMarketplace = ref(route.query.from === 'marketplace' || route.meta.fromMarketplace === true);


async function handleAddToLibrary() {
    if (!agent.value || isAlreadyInLibrary(agent.value.agent_id)) return;
    try {
        await agentStore.addAgentToUserLibrary(agent.value.agent_id);
        // Optionally show a success toast
    } catch (error) {
        // Optionally show an error toast
        console.error("Error adding to library from detail view:", error);
    }
}

</script>

<style scoped>
.system-prompt {
  white-space: pre-wrap; /* Allows text to wrap and respects newlines */
  word-break: break-word;
  font-family: monospace;
  font-size: 0.9em;
  max-height: 300px;
  overflow-y: auto;
}
ul {
    list-style-type: disc;
    padding-left: 20px;
}
</style>
