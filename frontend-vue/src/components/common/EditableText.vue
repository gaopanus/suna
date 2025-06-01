<template>
  <div class="editable-text-container" @click="handleClickOutside">
    <div
      v-if="!isEditing"
      @click.stop="startEditing"
      class="display-mode"
      data-testid="editable-text-display" <!-- Added data-testid -->
    >
      <slot name="display" :value="modelValue" :placeholderText="placeholderText">
        <span v-if="modelValue" :class="textClass">{{ modelValue }}</span>
        <span v-else :class="['placeholder-text', placeholderClass]">{{ placeholderText }}</span>
      </slot>
      <v-icon v-if="showEditIcon" size="x-small" class="ml-1 edit-icon">mdi-pencil-outline</v-icon>
    </div>

    <div v-else class="edit-mode">
      <v-textarea
        v-if="multiline"
        v-model="internalValue"
        ref="inputRef"
        :label="label"
        :placeholder="placeholder"
        :rows="rows"
        auto-grow
        dense
        variant="outlined"
        hide-details="auto"
        @blur="handleBlur"
        @keydown.enter.exact="handleEnterKey"
        @keydown.esc="cancelEditing"
        class="mb-2"
        data-testid="editable-textarea"
      ></v-textarea>
      <v-text-field
        v-else
        v-model="internalValue"
        ref="inputRef"
        :label="label"
        :placeholder="placeholder"
        dense
        variant="outlined"
        hide-details="auto"
        @blur="handleBlur"
        @keydown.enter.prevent="saveAndStopEditing"
        @keydown.esc="cancelEditing"
        class="mb-2"
        data-testid="editable-textfield"
      ></v-text-field>

      <div class="actions" v-if="showActions">
        <v-btn
            color="primary"
            @click="saveAndStopEditing"
            size="small"
            :loading="loading"
            data-testid="save-button" <!-- Added data-testid -->
        >Save</v-btn>
        <v-btn
            text
            @click="cancelEditing"
            size="small"
            class="ml-2"
            data-testid="cancel-button" <!-- Added data-testid -->
        >Cancel</v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'; // Added computed

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Click to edit',
  },
  label: {
    type: String,
    default: 'Edit value'
  },
  multiline: {
    type: Boolean,
    default: false,
  },
  rows: {
    type: [String, Number],
    default: 3,
  },
  textClass: {
    type: String,
    default: 'text-body-1',
  },
  placeholderClass: {
    type: String,
    default: 'text-grey text-italic',
  },
  showEditIcon: {
    type: Boolean,
    default: true,
  },
  showActions: {
      type: Boolean,
      default: true,
  },
  loading: {
      type: Boolean,
      default: false,
  },
  closeOnEnter: {
      type: Boolean,
      default: true,
  }
});

const emit = defineEmits(['update:modelValue', 'save', 'cancel']);

const isEditing = ref(false);
const internalValue = ref(props.modelValue);
const inputRef = ref(null);

const placeholderText = computed(() => props.placeholder || (props.multiline ? 'Click to add details...' : 'Click to edit text...'));

watch(() => props.modelValue, (newValue) => {
  if (!isEditing.value) {
    internalValue.value = newValue;
  }
});

async function startEditing() {
  if (isEditing.value) return;
  internalValue.value = props.modelValue;
  isEditing.value = true;
  await nextTick();
  inputRef.value?.focus();
  inputRef.value?.select();
}

function saveAndStopEditing() {
  if (internalValue.value !== props.modelValue) {
    emit('update:modelValue', internalValue.value);
    emit('save', internalValue.value);
  }
  isEditing.value = false;
}

function cancelEditing() {
  internalValue.value = props.modelValue;
  isEditing.value = false;
  emit('cancel');
}

function handleBlur(event) {
  if (!props.showActions && !event.relatedTarget) {
    saveAndStopEditing();
  } else if (props.showActions && event.relatedTarget && !event.currentTarget.closest('.edit-mode')?.contains(event.relatedTarget)) {
    // If actions are shown, and click is outside the edit-mode containing element, consider it a cancel
    // This requires the parent of input and buttons to have class 'edit-mode'
     cancelEditing();
  }
}


function handleEnterKey(event) {
    if (props.multiline) {
        if (event.ctrlKey || event.metaKey) {
            saveAndStopEditing();
        }
    } else {
        if (props.closeOnEnter) {
            saveAndStopEditing();
        }
    }
}

function handleClickOutside(event) {
    // This is a placeholder for a more robust click-outside directive if needed
}

defineExpose({
    startEditing,
    saveAndStopEditing,
    cancelEditing
});

</script>

<style scoped>
.editable-text-container {
  cursor: pointer;
  width: 100%;
}
.display-mode {
  padding: 4px 0;
  transition: background-color 0.2s ease-in-out;
  border-radius: 4px;
  display: flex; /* For icon alignment */
  align-items: center; /* For icon alignment */
}
.display-mode:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.05);
}
.edit-icon {
  visibility: hidden;
  opacity: 0.6;
  margin-left: 4px;
}
.display-mode:hover .edit-icon {
  visibility: visible;
}
.edit-mode {
  cursor: default;
}
.actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
</style>
