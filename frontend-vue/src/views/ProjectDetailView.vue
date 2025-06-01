<template>
  <v-container fluid>
    <div v-if="projectStore.isLoadingProjectDetail || (!project && !projectStore.projectError)">
      <v-row>
        <v-col cols="12">
          <v-progress-linear indeterminate color="primary"></v-progress-linear>
          <p class="text-center mt-2">Loading project details...</p>
        </v-col>
      </v-row>
    </div>

    <v-alert v-if="projectStore.projectError && !project" type="error" class="my-4">
      Failed to load project: {{ projectStore.projectError.message }}
      <br>
      <v-btn color="primary" @click="goBackToProjects" class="mt-2">Back to Projects</v-btn>
    </v-alert>

    <div v-if="project">
      <v-row>
        <v-col cols="12" class="d-flex justify-space-between align-center">
          <div>
            <h1 class="text-h4">{{ project.name }}</h1>
            <p class="text-subtitle-1 text-grey">{{ project.description || 'No description.' }}</p>
            <p class="text-caption text-grey-darken-1">Project ID: {{ project.id }}</p>
          </div>
          <v-btn color="primary" @click="openCreateThreadDialog">
            <v-icon left>mdi-plus-circle-outline</v-icon>
            New Thread
          </v-btn>
        </v-col>
      </v-row>

      <v-divider class="my-4"></v-divider>

      <h2 class="text-h5 mb-3">Threads</h2>
      <v-progress-linear indeterminate color="primary" v-if="projectStore.isLoadingThreads && projectStore.threads.length === 0"></v-progress-linear>

      <v-alert v-if="projectStore.threadError && !projectStore.isLoadingThreads" type="error" class="my-4">
        Failed to load threads: {{ projectStore.threadError.message }}
      </v-alert>

      <div v-if="!projectStore.isLoadingThreads && projectStore.threads.length === 0 && !projectStore.threadError" class="text-center text-grey py-5">
        <v-icon size="x-large" class="my-3">mdi-forum-outline</v-icon>
        <p>No threads yet in this project. Create one to start a conversation.</p>
      </div>

      <v-list lines="two" v-else>
        <v-list-item
          v-for="thread in projectStore.projectThreads"
          :key="thread.thread_id"
          @click="navigateToChat(thread.thread_id)"
          link
          class="mb-2"
          elevation="1"
          border
        >
          <template v-slot:prepend>
            <v-icon color="primary">mdi-forum</v-icon>
          </template>
          <v-list-item-title>Thread ID: {{ thread.thread_id }}</v-list-item-title>
          <v-list-item-subtitle>
            Created: {{ new Date(thread.created_at).toLocaleString() }}
            <span v-if="thread.updated_at"> | Updated: {{ new Date(thread.updated_at).toLocaleString() }}</span>
          </v-list-item-subtitle>
          <template v-slot:append>
            <v-btn
                icon="mdi-delete-outline"
                variant="text"
                color="red-lighten-1"
                size="small"
                @click.stop="confirmDeleteThread(thread)"
            ></v-btn>
            <v-icon>mdi-chevron-right</v-icon>
          </template>
        </v-list-item>
      </v-list>
    </div>

    <!-- Dialog for creating a new thread (can be simple or have a form) -->
    <v-dialog v-model="createThreadDialog.show" persistent max-width="500px">
        <v-card>
            <v-card-title class="text-h5">Start New Thread</v-card-title>
            <v-card-text>
                Are you sure you want to create a new thread for project "<strong>{{ project?.name }}</strong>"?
                <!-- You can add a form here if threads need names or initial messages -->
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="createThreadDialog.show = false" :disabled="createThreadDialog.isCreating">Cancel</v-btn>
                <v-btn color="primary" @click="executeCreateThread" :loading="createThreadDialog.isCreating">Create Thread</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Confirmation Dialog for Thread Deletion -->
    <v-dialog v-model="deleteThreadConfirmDialog.show" persistent max-width="400px">
        <v-card>
            <v-card-title class="text-h5">Confirm Deletion</v-card-title>
            <v-card-text>
                Are you sure you want to delete thread "<strong>{{ deleteThreadConfirmDialog.thread?.thread_id }}</strong>"?
                This action cannot be undone.
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="deleteThreadConfirmDialog.show = false" :disabled="deleteThreadConfirmDialog.isDeleting">Cancel</v-btn>
                <v-btn color="red-darken-1" @click="executeDeleteThread" :loading="deleteThreadConfirmDialog.isDeleting">Delete</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '@/store/projectStore';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();

const projectId = ref(route.params.projectId);

const project = computed(() => projectStore.loadedProject);

const createThreadDialog = ref({
    show: false,
    isCreating: false,
});

const deleteThreadConfirmDialog = ref({
    show: false,
    thread: null,
    isDeleting: false,
});


onMounted(() => {
  // Clear previous project details before fetching new one
  // projectStore.clearCurrentProject(); // Done by selectProject now
  projectStore.selectProject(projectId.value);
});

// Watch for route param changes if navigating between project details directly (less common)
watch(() => route.params.projectId, (newId) => {
  if (newId && newId !== projectId.value) {
    projectId.value = newId;
    // projectStore.clearCurrentProject();
    projectStore.selectProject(newId);
  }
});

const navigateToChat = (threadId) => {
  router.push({ name: 'Chat', params: { projectId: project.value.id, threadId } });
};

const goBackToProjects = () => {
    router.push({ name: 'ProjectList' });
};

const openCreateThreadDialog = () => {
    createThreadDialog.value.show = true;
};

const executeCreateThread = async () => {
    if (!project.value?.id) return;
    createThreadDialog.value.isCreating = true;
    try {
        // The createThread action in store already navigates
        await projectStore.createThread(project.value.id);
        createThreadDialog.value.show = false;
    } catch (error) {
        console.error("Failed to create thread from ProjectDetailView:", error);
        // Error should be in projectStore.threadError and displayed by an alert if needed
    } finally {
        createThreadDialog.value.isCreating = false;
    }
};

const confirmDeleteThread = (thread) => {
    deleteThreadConfirmDialog.value.thread = thread;
    deleteThreadConfirmDialog.value.show = true;
};

const executeDeleteThread = async () => {
    if (!deleteThreadConfirmDialog.value.thread) return;
    deleteThreadConfirmDialog.value.isDeleting = true;
    try {
        await projectStore.deleteThread(deleteThreadConfirmDialog.value.thread.thread_id);
        deleteThreadConfirmDialog.value.show = false;
        deleteThreadConfirmDialog.value.thread = null;
    } catch (error) {
        console.error('Failed to delete thread (view):', error);
    } finally {
        deleteThreadConfirmDialog.value.isDeleting = false;
    }
};

</script>

<style scoped>
/* Add specific styles if needed */
</style>
