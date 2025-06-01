<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="handleUpdateModelValue"
    :persistent="persistent"
    :max-width="maxWidth"
    scrollable
    v-bind="$attrs"
  >
    <v-card :rounded="cardRounded">
      <v-card-title class="text-h5 pa-4">
        <slot name="title">
          <span v-if="title">{{ title }}</span>
          <!-- Optional: Add a default close button in the title if no slot is provided -->
          <v-spacer v-if="!$slots.title && title"></v-spacer>
          <v-btn
            v-if="!$slots.title && showDefaultCloseButtonInTitle"
            icon="mdi-close"
            variant="text"
            size="small"
            @click="closeDialog"
          ></v-btn>
        </slot>
      </v-card-title>

      <v-divider v-if="$slots.title || title"></v-divider>

      <v-card-text class="pa-4 dialog-content">
        <slot>
          <!-- Default content if no slot is provided -->
          <p v-if="!$slots.default">Dialog content goes here.</p>
        </slot>
      </v-card-text>

      <v-divider v-if="$slots.actions"></v-divider>

      <v-card-actions class="pa-4">
        <slot name="actions">
          <!-- Default actions: Spacer and Close button -->
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="closeDialog">Close</v-btn>
        </slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { // For v-model
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: null,
  },
  persistent: {
    type: Boolean,
    default: false,
  },
  maxWidth: {
    type: [String, Number],
    default: '600px',
  },
  cardRounded: {
    type: [String, Boolean, Number],
    default: 'lg' // Vuetify's large rounding
  },
  showDefaultCloseButtonInTitle: { // Prop to control default close button in title
      type: Boolean,
      default: true,
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

const handleUpdateModelValue = (value) => {
  emit('update:modelValue', value);
  if (!value) {
    emit('close'); // Emit a specific close event when dialog is closed
  }
};

const closeDialog = () => {
  emit('update:modelValue', false);
  emit('close');
};

// Use $attrs to pass down any other v-dialog props like 'fullscreen', 'transition', etc.
</script>

<style scoped>
.dialog-content {
  /* Example: Add some default max height for scrollable content if needed */
  /* max-height: 70vh; */
  /* overflow-y: auto; */ /* v-dialog with scrollable prop handles this better */
}
/* Ensure title slot content can also use spacer and align items */
:deep(.v-card-title > .v-slot[name="title"]) {
    display: flex;
    align-items: center;
    width: 100%;
}
</style>
