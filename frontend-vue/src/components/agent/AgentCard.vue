<template>
  <v-card class="fill-height d-flex flex-column">
    <v-img v-if="agent.avatar" :src="agent.avatar" height="150px" cover></v-img>
    <v-avatar v-else :color="agent.avatar_color || 'primary'" size="large" class="ma-2 align-self-center" style="height: 150px; width: 150px; font-size: 4rem;">
      {{ agent.name ? agent.name.charAt(0).toUpperCase() : 'A' }}
    </v-avatar>

    <v-card-title class="text-truncate">
      {{ agent.name }}
    </v-card-title>
    <v-card-subtitle class="pb-1">
      <span v-if="agent.creator_name">By: {{ agent.creator_name }}</span>
      <span v-else-if="isUserAgent">My Agent</span>
      <span v-else>Unknown Author</span>
      <br>
      <span v-if="agent.tags && agent.tags.length" class="text-caption">
        <v-chip v-for="tag in agent.tags.slice(0, 2)" :key="tag" size="x-small" class="mr-1 mt-1">{{ tag }}</v-chip>
      </span>
    </v-card-subtitle>

    <v-card-text class="flex-grow-1 text-caption">
      {{ truncateDescription(agent.description || 'No description available.', 100) }}
    </v-card-text>

    <v-divider></v-divider>

    <v-card-actions>
      <v-btn
        size="small"
        variant="text"
        @click="viewDetails"
      >
        View Details
      </v-btn>
      <v-spacer></v-spacer>

      <template v-if="isUserAgent">
        <v-btn icon="mdi-pencil" size="small" variant="text" color="grey-darken-1" @click="editAgent"></v-btn>
        <v-btn icon="mdi-delete" size="small" variant="text" color="red-lighten-1" @click="confirmDelete"></v-btn>
      </template>
      <template v-else>
        <v-btn
            color="primary"
            variant="tonal"
            size="small"
            @click="addToLibrary"
            :loading="isAdding"
            :disabled="isAdded"
        >
          <v-icon left>{{ isAdded ? 'mdi-check-circle-outline' : 'mdi-plus-circle-outline' }}</v-icon>
          {{ isAdded ? 'Added' : 'Add to Library' }}
        </v-btn>
      </template>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAgentStore } from '@/store/agentStore';

const props = defineProps({
  agent: {
    type: Object,
    required: true,
  },
  isUserAgent: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();
const agentStore = useAgentStore();

const isAdding = ref(false);
const isAdded = computed(() => {
    // Check if this marketplace agent (by original ID if it's a copy) exists in user agents
    // This logic might need refinement based on how agent IDs are handled for copies.
    // If agent.agent_id is the original marketplace ID:
    return agentStore.allUserAgents.some(ua => ua.marketplace_original_id === props.agent.agent_id || ua.name === props.agent.name);
});


function truncateDescription(text, length) {
  if (text.length <= length) {
    return text;
  }
  return text.substring(0, length) + '...';
}

function viewDetails() {
  router.push({ name: 'AgentDetail', params: { agentId: props.agent.agent_id } });
}

async function addToLibrary() {
  if (isAdded.value) return; // Already added or action in progress
  isAdding.value = true;
  try {
    await agentStore.addAgentToUserLibrary(props.agent.agent_id);
    // isAdded will become true due to computed property reacting to store change
  } catch (error) {
    console.error('Failed to add agent to library:', error);
    // Optionally show a toast or error message
  } finally {
    isAdding.value = false;
  }
}

function editAgent() {
  router.push({ name: 'AgentEdit', params: { agentId: props.agent.agent_id } });
}

function confirmDelete() {
  // Usually, you'd open a confirmation dialog here.
  // For simplicity, directly calling store action.
  if (confirm(`Are you sure you want to delete agent "${props.agent.name}"?`)) {
    agentStore.deleteUserAgent(props.agent.agent_id).catch(err => {
        console.error("Error deleting from card:", err);
        alert(`Failed to delete agent: ${err.message || 'Unknown error'}`);
    });
  }
}
</script>

<style scoped>
.v-card-title {
  font-size: 1.1rem;
}
.v-card-subtitle {
    min-height: 40px; /* Ensure space for tags */
}
</style>
