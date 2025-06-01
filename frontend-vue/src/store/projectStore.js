import { defineStore } from 'pinia';
import {
    getProjects,
    createProject as apiCreateProject,
    deleteProject as apiDeleteProject,
    getProject,
    getThreads,
    createThread as apiCreateThread,
    deleteThread as apiDeleteThread,
} from '@/services/api';
import router from '@/router';
import { useNotificationsStore } from './notifications';

export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [],
    currentProject: null,
    threads: [],

    isLoadingProjects: false,
    isLoadingProjectDetail: false,
    isLoadingThreads: false,
    isSubmittingProject: false, // For create/update project operations
    isSubmittingThread: false, // For create/update thread operations

    projectError: null, // { message: string, details?: any, operation?: string }
    threadError: null,  // { message: string, details?: any, operation?: string }
  }),

  getters: {
    projectList: (state) => state.projects,
    loadedProject: (state) => state.currentProject,
    projectThreads: (state) => state.threads,
  },

  actions: {
    clearProjectError() {
        this.projectError = null;
    },
    clearThreadError() {
        this.threadError = null;
    },
    clearAllErrors() {
        this.projectError = null;
        this.threadError = null;
    },

    // --- Project Actions ---
    async fetchProjects() {
      this.isLoadingProjects = true;
      this.projectError = null;
      const notifications = useNotificationsStore();
      try {
        this.projects = await getProjects(); // api.js already handles its own errors and returns [] or throws
      } catch (error) { // Catch errors re-thrown by api.js or network errors
        console.error('Error fetching projects in store:', error);
        // error from api.js is already structured by handleApiError
        this.projectError = { message: error.message || 'Failed to load projects.', details: error.details, operation: 'fetchProjects' };
        this.projects = [];
        notifications.showError(this.projectError.message);
      } finally {
        this.isLoadingProjects = false;
      }
    },

    async createProject(projectData) {
      this.isSubmittingProject = true;
      this.projectError = null;
      const notifications = useNotificationsStore();
      try {
        const newProject = await apiCreateProject(projectData);
        if (newProject) {
          await this.fetchProjects(); // Refresh list
          notifications.showSuccess(`Project "${newProject.name}" created successfully!`);
          return newProject;
        } else {
          // apiCreateProject would have thrown an error if it returned null due to an issue
          // but if it just returns null without error (e.g. user not logged in), this is a fallback.
          throw new Error('Project creation returned no data or failed silently.');
        }
      } catch (error) {
        console.error('Error creating project in store:', error);
        this.projectError = { message: error.message || 'Failed to create project.', details: error.details, operation: 'createProject' };
        notifications.showError(this.projectError.message);
        throw this.projectError; // Re-throw for component to handle if needed
      } finally {
        this.isSubmittingProject = false;
      }
    },

    async deleteProject(projectId) {
      // Using isSubmittingProject as a general "action in progress" flag for projects
      this.isSubmittingProject = true;
      this.projectError = null;
      const notifications = useNotificationsStore();
      try {
        const success = await apiDeleteProject(projectId);
        if (success) {
          await this.fetchProjects();
          if (this.currentProject?.id === projectId) {
            this.currentProject = null;
            this.threads = [];
          }
          notifications.showSuccess('Project deleted successfully.');
        } else {
          throw new Error('Project deletion failed at API level.');
        }
      } catch (error) {
        console.error('Error deleting project in store:', error);
        this.projectError = { message: error.message || 'Failed to delete project.', details: error.details, operation: 'deleteProject' };
        notifications.showError(this.projectError.message);
        throw this.projectError;
      } finally {
        this.isSubmittingProject = false;
      }
    },

    async selectProject(projectId) {
      if (this.currentProject?.id === projectId && this.threads.length > 0 && !this.isLoadingProjectDetail && !this.isLoadingThreads) {
        return;
      }
      this.isLoadingProjectDetail = true;
      this.projectError = null;
      this.currentProject = null;
      this.threads = [];
      const notifications = useNotificationsStore();

      try {
        const projectDetails = await getProject(projectId);
        if (projectDetails) {
          this.currentProject = projectDetails;
          await this.fetchThreads(projectId); // fetchThreads also handles its own errors/notifications
        } else {
          // getProject returns null if not found or error handled by api.js
          // If it threw an error, it would be caught below.
          // If it returned null, it means handleApiError in api.js already logged it.
          // We still set a specific error here for the store context.
          const specificError = new Error(`Project with ID ${projectId} not found or access denied.`);
          this.projectError = { message: specificError.message, operation: 'selectProject' };
          // notifications.showError(this.projectError.message); // api.js might have shown one
        }
      } catch (error) { // Catch errors from getProject if it re-throws
        console.error('Error selecting project in store:', error);
        this.projectError = { message: error.message || `Failed to load project ${projectId}.`, details: error.details, operation: 'selectProject' };
        notifications.showError(this.projectError.message);
        this.currentProject = null;
        this.threads = [];
      } finally {
        this.isLoadingProjectDetail = false;
      }
    },

    clearCurrentProject() {
        this.currentProject = null;
        this.threads = [];
        this.projectError = null;
        this.threadError = null;
        // console.log('ProjectStore: Current project and threads cleared.');
    },

    // --- Thread Actions (scoped to currentProject) ---
    async fetchThreads(projectIdToFetchFor) {
      const targetProjectId = projectIdToFetchFor || this.currentProject?.id;
      if (!targetProjectId) {
        this.threads = [];
        return;
      }

      this.isLoadingThreads = true;
      this.threadError = null;
      const notifications = useNotificationsStore();
      try {
        this.threads = await getThreads(targetProjectId);
      } catch (error) {
        console.error(`Error fetching threads for project ${targetProjectId} in store:`, error);
        this.threadError = { message: error.message || `Failed to load threads.`, details: error.details, operation: 'fetchThreads' };
        this.threads = [];
        notifications.showError(this.threadError.message);
      } finally {
        this.isLoadingThreads = false;
      }
    },

    async createThread(projectId, threadData = {}) {
      const targetProjectId = projectId || this.currentProject?.id;
      if (!targetProjectId) {
        const msg = 'No project selected to create a thread for.';
        this.threadError = { message: msg, operation: 'createThread' };
        useNotificationsStore().showError(msg);
        throw new Error(msg);
      }

      this.isSubmittingThread = true;
      this.threadError = null;
      const notifications = useNotificationsStore();
      try {
        const newThread = await apiCreateThread({ project_id: targetProjectId, ...threadData });
        if (newThread) {
          if (this.currentProject && this.currentProject.id === targetProjectId) {
            await this.fetchThreads(targetProjectId);
          }
          notifications.showSuccess(`New thread created successfully!`);
          router.push({ name: 'Chat', params: { projectId: targetProjectId, threadId: newThread.thread_id } });
          return newThread;
        } else {
          throw new Error('Thread creation returned no data.');
        }
      } catch (error) {
        console.error('Error creating thread in store:', error);
        this.threadError = { message: error.message || 'Failed to create thread.', details: error.details, operation: 'createThread' };
        notifications.showError(this.threadError.message);
        throw this.threadError;
      } finally {
        this.isSubmittingThread = false;
      }
    },

    async deleteThread(threadId) {
      this.isSubmittingThread = true;
      this.threadError = null;
      const notifications = useNotificationsStore();
      try {
        const success = await apiDeleteThread(threadId);
        if (success) {
          if (this.currentProject) {
            await this.fetchThreads(this.currentProject.id);
          }
          notifications.showSuccess('Thread deleted successfully.');
        } else {
          throw new Error('Thread deletion failed at API level.');
        }
      } catch (error) {
        console.error('Error deleting thread in store:', error);
        this.threadError = { message: error.message || 'Failed to delete thread.', details: error.details, operation: 'deleteThread' };
        notifications.showError(this.threadError.message);
        throw this.threadError;
      } finally {
        this.isSubmittingThread = false;
      }
    },
  },
});
