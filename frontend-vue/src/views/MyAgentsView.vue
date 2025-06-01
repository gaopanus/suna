<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h1 class="text-h4">My Agents</h1>
        <v-btn color="primary" :to="{ name: 'AgentCreate' }">
          <v-icon left>mdi-plus-box-outline</v-icon>
          Create Agent
        </v-btn>
      </v-col>
    </v-row>

    <v-progress-linear indeterminate color="primary" v-if="agentStore.isLoadingUserAgents && agentStore.userAgents.length === 0"></v-progress-linear>

    <v-alert v-if="agentStore.agentError && agentStore.agentError.operation === 'fetchUserAgents' && !agentStore.isLoadingUserAgents" type="error" class="my-4">
      Failed to load your agents: {{ agentStore.agentError.message }}
    </v-alert>

    <v-row v-if="!agentStore.isLoadingUserAgents && agentStore.userAgents.length === 0 && !(agentStore.agentError && agentStore.agentError.operation === 'fetchUserAgents')">
      <v-col cols="12" class="text-center text-grey py-10">
        <v-icon size="x-large" class="my-3">mdi-robot-confused-outline</v-icon>
        <p>You haven't created or added any agents to your library yet.</p>
        <p class="text-caption">Explore the <router-link :to="{name: 'AgentMarketplace'}">Marketplace</router-link> or create your own!</p>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col
        v-for="agent in agentStore.allUserAgents"
        :key="agent.agent_id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <AgentCard :agent="agent" :is-user-agent="true" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAgentStore } from '@/store/agentStore';
import AgentCard from '@/components/agent/AgentCard.vue';

const agentStore = useAgentStore();

onMounted(() => {
  // Fetch user's agents if not already loaded or a refresh is desired
  if (agentStore.userAgents.length === 0) {
    agentStore.fetchUserAgents();
  }
});
</script>

<style scoped>
/* Add specific styles if needed */
</style>
