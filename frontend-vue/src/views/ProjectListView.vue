<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h1>My Projects</h1>
        <v-btn color="primary" @click="openCreateDialog">
          <v-icon left>mdi-plus</v-icon>
          Create Project
        </v-btn>
      </v-col>
    </v-row>

    <v-progress-linear indeterminate color="primary" v-if="projectStore.isLoadingProjects && projectStore.projects.length === 0"></v-progress-linear>

    <v-alert v-if="projectStore.projectError && !projectStore.isLoadingProjects" type="error" class="my-4">
      {{ projectStore.projectError.message }}
    </v-alert>

    <v-row v-if="!projectStore.isLoadingProjects && projectStore.projects.length === 0 && !projectStore.projectError">
      <v-col cols="12" class="text-center text-grey">
        <v-icon size="x-large" class="my-3">mdi-folder-outline</v-icon>
        <p>No projects found. Get started by creating a new project.</p>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col
        v-for="project in projectStore.projectList"
        :key="project.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card class="fill-height d-flex flex-column">
          <v-card-title class="text-truncate">
            <router-link :to="{ name: 'ProjectDetail', params: { projectId: project.id } }" class="text-decoration-none text-primary">
              {{ project.name }}
            </router-link>
          </v-card-title>
          <v-card-subtitle class="text-caption">
            ID: {{ project.id }}
          </v-card-subtitle>
          <v-card-text class="flex-grow-1 text-truncate">
            {{ project.description || 'No description available.' }}
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-pencil" size="small" variant="text" color="grey-darken-1" @click="openEditDialog(project)"></v-btn>
            <v-btn icon="mdi-delete" size="small" variant="text" color="red-lighten-1" @click="confirmDeleteProject(project)"></v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create/Edit Project Dialog -->
    <v-dialog v-model="projectDialog.show" persistent max-width="600px">
      <ProjectCreateForm
        :editing-project="projectDialog.editingProject"
        :is-loading="projectDialog.isSubmitting"
        @submit="handleProjectFormSubmit"
        @cancel="closeProjectDialog"
        @error="handleProjectFormError"
        ref="projectCreateFormRef"
      />
    </v-dialog>

    <!-- Confirmation Dialog for Deletion -->
    <v-dialog v-model="deleteConfirmDialog.show" persistent max-width="400px">
        <v-card>
            <v-card-title class="text-h5">Confirm Deletion</v-card-title>
            <v-card-text>
                Are you sure you want to delete the project "<strong>{{ deleteConfirmDialog.project?.name }}</strong>"?
                This action cannot be undone.
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="deleteConfirmDialog.show = false" :disabled="deleteConfirmDialog.isDeleting">Cancel</v-btn>
                <v-btn color="red-darken-1" @click="executeDeleteProject" :loading="deleteConfirmDialog.isDeleting">Delete</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useProjectStore } from '@/store/projectStore';
import ProjectCreateForm from '@/components/project/ProjectCreateForm.vue';
import { useRouter } from 'vue-router'; // Not used yet, but might be for navigation

const projectStore = useProjectStore();
const router = useRouter(); // For navigation if needed

const projectDialog = ref({
  show: false,
  editingProject: null, // null for create, project object for edit
  isSubmitting: false,
});
const projectCreateFormRef = ref(null); // Ref to access form methods like reset

const deleteConfirmDialog = ref({
    show: false,
    project: null,
    isDeleting: false,
});

onMounted(() => {
  projectStore.fetchProjects();
});

const openCreateDialog = () => {
  projectDialog.value.editingProject = null;
  projectDialog.value.show = true;
  projectCreateFormRef.value?.resetForm(); // Ensure form is clean
};

const openEditDialog = (project) => {
  projectDialog.value.editingProject = { ...project }; // Pass a copy to avoid direct state mutation
  projectDialog.value.show = true;
};

const closeProjectDialog = () => {
  projectDialog.value.show = false;
  projectDialog.value.editingProject = null;
  projectDialog.value.isSubmitting = false;
  projectCreateFormRef.value?.resetForm();
};

const handleProjectFormSubmit = async (formData) => {
  projectDialog.value.isSubmitting = true;
  try {
    if (projectDialog.value.editingProject && projectDialog.value.editingProject.id) {
      // Update logic - projectStore needs an updateProject action
      // For now, let's assume it exists or add it later
      // await projectStore.updateProject(projectDialog.value.editingProject.id, formData);
      console.log("Update project logic to be implemented in store", projectDialog.value.editingProject.id, formData)
       alert('Project update functionality to be fully implemented in store.');
    } else {
      await projectStore.createProject(formData);
    }
    closeProjectDialog();
  } catch (error) {
    // Error should be set in store, or pass it to form component to display
    console.error('Failed to save project (view):', error);
    // The form itself might display the error if passed via prop or if store error is watched
    // For now, just log and keep dialog open if store doesn't handle display
    // projectCreateFormRef.value?.setError(error.message || "Failed to save project.");
  } finally {
    projectDialog.value.isSubmitting = false;
  }
};

const handleProjectFormError = (error) => {
    // This can be used if the form emits an error, e.g., validation before submit
    // Or if an error occurs during the emit('submit') process itself
    console.error("Error from ProjectCreateForm:", error);
    // The projectStore.projectError will likely be set by the action,
    // so we might not need to do much here unless it's a form-specific UI error.
};

const confirmDeleteProject = (project) => {
    deleteConfirmDialog.value.project = project;
    deleteConfirmDialog.value.show = true;
};

const executeDeleteProject = async () => {
    if (!deleteConfirmDialog.value.project) return;
    deleteConfirmDialog.value.isDeleting = true;
    try {
        await projectStore.deleteProject(deleteConfirmDialog.value.project.id);
        deleteConfirmDialog.value.show = false;
        deleteConfirmDialog.value.project = null;
    } catch (error) {
        console.error('Failed to delete project (view):', error);
        // Error should be in projectStore.projectError and displayed by v-alert
    } finally {
        deleteConfirmDialog.value.isDeleting = false;
    }
};

</script>

<style scoped>
.text-decoration-none {
  text-decoration: none;
}
.text-primary:hover {
    text-decoration: underline;
}
</style>
