<template>
  <v-card>
    <v-card-title>{{ editingProject ? 'Edit Project' : 'Create New Project' }}</v-card-title>
    <v-card-text>
      <v-form @submit.prevent="submitForm" ref="projectFormRef">
        <v-text-field
          v-model="formData.name"
          label="Project Name"
          :rules="[rules.required, rules.minLength(3)]"
          required
          autofocus
          class="mb-2"
        ></v-text-field>
        <v-textarea
          v-model="formData.description"
          label="Description (Optional)"
          rows="3"
          auto-grow
        ></v-textarea>

        <v-alert v-if="localError" type="error" density="compact" class="mt-3">
          {{ localError }}
        </v-alert>

      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text @click="cancel">Cancel</v-btn>
      <v-btn color="primary" @click="submitForm" :loading="isLoading">
        {{ editingProject ? 'Save Changes' : 'Create Project' }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useProjectStore } from '@/store/projectStore';

const props = defineProps({
  editingProject: { // Pass the project object if editing
    type: Object,
    default: null,
  },
  isLoading: { // Prop to indicate loading state, controlled by parent
      type: Boolean,
      default: false,
  }
});

const emit = defineEmits(['submit', 'cancel', 'error']);

const projectStore = useProjectStore();
const projectFormRef = ref(null); // Ref for the v-form

const formData = ref({
  name: '',
  description: '',
});
const localError = ref(null);

const rules = {
  required: value => !!value || 'This field is required.',
  minLength: (length) => value => (value && value.length >= length) || `Must be at least ${length} characters.`,
};

// Watch for editingProject prop to populate form
watch(() => props.editingProject, (newVal) => {
  if (newVal) {
    formData.value.name = newVal.name || '';
    formData.value.description = newVal.description || '';
  } else {
    formData.value.name = '';
    formData.value.description = '';
  }
}, { immediate: true });


async function submitForm() {
  localError.value = null; // Clear previous local errors
  const { valid } = await projectFormRef.value.validate();
  if (!valid) {
    return;
  }

  try {
    emit('submit', { ...formData.value }); // Emit data for parent to handle API call
  } catch (error) {
    console.error("Error during form submission prop emit (should not happen):", error);
    localError.value = "An unexpected error occurred.";
    emit('error', error); // Emit error for parent
  }
}

function cancel() {
  emit('cancel');
}

// Expose form reset if needed by parent
const resetForm = () => {
    projectFormRef.value?.reset();
    projectFormRef.value?.resetValidation();
    formData.value.name = '';
    formData.value.description = '';
    localError.value = null;
    if (props.editingProject) { // Repopulate if was editing
        formData.value.name = props.editingProject.name || '';
        formData.value.description = props.editingProject.description || '';
    }
};

defineExpose({
    resetForm
});

</script>

<style scoped>
/* Add any specific styles for the form here */
</style>
