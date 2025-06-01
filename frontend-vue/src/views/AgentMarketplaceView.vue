<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4">Agent Marketplace</h1>
        <p class="text-subtitle-1 text-grey">Discover and add new agents to your library.</p>
      </v-col>
    </v-row>

    <!-- TODO: Add Search and Filter controls here -->
    <!-- <v-row>
      <v-col cols="12" md="6">
        <v-text-field label="Search Agents..." prepend-inner-icon="mdi-magnify" v-model="searchQuery" @input="debouncedFetchAgents"></v-text-field>
      </v-col>
    </v-row> -->

    <v-progress-linear indeterminate color="primary" v-if="agentStore.isLoadingMarketplace && agentStore.marketplaceAgents.length === 0"></v-progress-linear>

    <v-alert v-if="agentStore.agentError && agentStore.agentError.operation === 'fetchMarketplaceAgents' && !agentStore.isLoadingMarketplace" type="error" class="my-4">
      Failed to load marketplace agents: {{ agentStore.agentError.message }}
    </v-alert>

    <v-row v-if="!agentStore.isLoadingMarketplace && agentStore.marketplaceAgents.length === 0 && !(agentStore.agentError && agentStore.agentError.operation === 'fetchMarketplaceAgents')">
      <v-col cols="12" class="text-center text-grey py-10">
        <v-icon size="x-large" class="my-3">mdi-store-search-outline</v-icon>
        <p>No agents found in the marketplace currently.</p>
        <p class="text-caption">Try adjusting your search or check back later.</p>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col
        v-for="agent in agentStore.allMarketplaceAgents"
        :key="agent.agent_id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <AgentCard :agent="agent" :is-user-agent="false" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useAgentStore } from '@/store/agentStore';
import AgentCard from '@/components/agent/AgentCard.vue';

const agentStore = useAgentStore();
const searchQuery = ref(''); // For future search implementation

// TODO: Debounce search if implementing live search
// const debouncedFetchAgents = _.debounce(() => {
//   agentStore.fetchMarketplaceAgents({ search: searchQuery.value });
// }, 500);

onMounted(() => {
  // Fetch agents if not already loaded or if a refresh is desired
  if (agentStore.marketplaceAgents.length === 0) {
    agentStore.fetchMarketplaceAgents();
  }
});
</script>

<style scoped>
/* Add specific styles if needed */
</style>
