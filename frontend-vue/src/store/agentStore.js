import { defineStore } from 'pinia';
import {
  getMarketplaceAgents,
  getUserAgents,
  getAgentDetails,
  addAgentToLibrary as apiAddAgentToLibrary,
  createAgent as apiCreateAgent,
  updateAgent as apiUpdateAgent,
  deleteAgent as apiDeleteAgent,
} from '@/services/api';
import { useNotificationsStore } from './notifications';

export const useAgentStore = defineStore('agent', {
  state: () => ({
    marketplaceAgents: [],
    userAgents: [],
    currentAgent: null,

    isLoadingMarketplace: false,
    isLoadingUserAgents: false,
    isLoadingCurrentAgent: false,
    isSubmitting: false,

    agentError: null, // { message: string, details?: any, operation?: string }
  }),

  getters: {
    allMarketplaceAgents: (state) => state.marketplaceAgents,
    allUserAgents: (state) => state.userAgents,
    loadedAgent: (state) => state.currentAgent,
  },

  actions: {
    clearError() {
      this.agentError = null;
    },

    async fetchMarketplaceAgents(params = {}) {
      this.isLoadingMarketplace = true;
      this.agentError = null;
      const notifications = useNotificationsStore();
      try {
        const data = await getMarketplaceAgents(params); // api.js handles its own errors, re-throws structured
        this.marketplaceAgents = data.agents || [];
      } catch (error) { // Catch errors re-thrown by api.js or network errors
        console.error('Error fetching marketplace agents in store:', error);
        this.agentError = { message: error.message || 'Failed to load marketplace agents.', details: error.details, operation: 'fetchMarketplaceAgents' };
        this.marketplaceAgents = [];
        notifications.showError(this.agentError.message);
      } finally {
        this.isLoadingMarketplace = false;
      }
    },

    async fetchUserAgents() {
      this.isLoadingUserAgents = true;
      this.agentError = null;
      const notifications = useNotificationsStore();
      try {
        this.userAgents = await getUserAgents();
      } catch (error) {
        console.error('Error fetching user agents in store:', error);
        this.agentError = { message: error.message || 'Failed to load your agents.', details: error.details, operation: 'fetchUserAgents' };
        this.userAgents = [];
        notifications.showError(this.agentError.message);
      } finally {
        this.isLoadingUserAgents = false;
      }
    },

    async fetchAgentDetails(agentId) {
      if (this.currentAgent?.agent_id === agentId && !this.isLoadingCurrentAgent) return;

      this.isLoadingCurrentAgent = true;
      this.agentError = null;
      // this.currentAgent = null; // Clear only if ID is different, or let it be overwritten
      const notifications = useNotificationsStore();
      try {
        const agent = await getAgentDetails(agentId);
        this.currentAgent = agent;
      } catch (error) {
        console.error(`Error fetching agent details for ${agentId} in store:`, error);
        this.agentError = { message: error.message || `Failed to load details for agent ${agentId}.`, details: error.details, operation: 'fetchAgentDetails' };
        this.currentAgent = null; // Ensure it's cleared on error
        notifications.showError(this.agentError.message);
      } finally {
        this.isLoadingCurrentAgent = false;
      }
    },

    clearCurrentAgent() {
        this.currentAgent = null;
        this.agentError = null; // Also clear any errors related to loading this agent
    },

    async addAgentToUserLibrary(marketplaceAgentId) {
      this.isSubmitting = true;
      this.agentError = null;
      const notifications = useNotificationsStore();
      try {
        const result = await apiAddAgentToLibrary(marketplaceAgentId);
        await this.fetchUserAgents(); // Refresh user's agent list
        notifications.showSuccess(result.message || `Agent added to your library!`);
        return result;
      } catch (error) {
        console.error(`Error adding agent ${marketplaceAgentId} to library in store:`, error);
        this.agentError = { message: error.message || 'Failed to add agent to library.', details: error.details, operation: 'addAgentToUserLibrary' };
        notifications.showError(this.agentError.message);
        throw this.agentError;
      } finally {
        this.isSubmitting = false;
      }
    },

    async createUserAgent(agentData) {
      this.isSubmitting = true;
      this.agentError = null;
      const notifications = useNotificationsStore();
      try {
        const newAgent = await apiCreateAgent(agentData);
        await this.fetchUserAgents();
        notifications.showSuccess(`Agent "${newAgent.name}" created successfully!`);
        return newAgent;
      } catch (error) {
        console.error('Error creating user agent in store:', error);
        this.agentError = { message: error.message || 'Failed to create agent.', details: error.details, operation: 'createUserAgent' };
        notifications.showError(this.agentError.message);
        throw this.agentError;
      } finally {
        this.isSubmitting = false;
      }
    },

    async updateUserAgent(agentId, agentData) {
      this.isSubmitting = true;
      this.agentError = null;
      const notifications = useNotificationsStore();
      try {
        const updatedAgent = await apiUpdateAgent(agentId, agentData);
        await this.fetchUserAgents();
        if (this.currentAgent?.agent_id === agentId) {
          // Update currentAgent with the new data, ensure full object is there
          this.currentAgent = { ...this.currentAgent, ...updatedAgent };
        }
        notifications.showSuccess(`Agent "${updatedAgent.name}" updated successfully!`);
        return updatedAgent;
      } catch (error) {
        console.error(`Error updating agent ${agentId} in store:`, error);
        this.agentError = { message: error.message || `Failed to update agent.`, details: error.details, operation: 'updateUserAgent' };
        notifications.showError(this.agentError.message);
        throw this.agentError;
      } finally {
        this.isSubmitting = false;
      }
    },

    async deleteUserAgent(agentId) {
      this.isSubmitting = true;
      this.agentError = null;
      const notifications = useNotificationsStore();
      try {
        await apiDeleteAgent(agentId);
        await this.fetchUserAgents();
        if (this.currentAgent?.agent_id === agentId) {
          this.currentAgent = null;
        }
        notifications.showSuccess('Agent deleted successfully.');
      } catch (error) {
        console.error(`Error deleting agent ${agentId} in store:`, error);
        this.agentError = { message: error.message || `Failed to delete agent.`, details: error.details, operation: 'deleteUserAgent' };
        notifications.showError(this.agentError.message);
        throw this.agentError;
      } finally {
        this.isSubmitting = false;
      }
    },
  },
});
