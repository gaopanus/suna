<template>
  <BaseDialog
    :model-value="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    title="Payment Required"
    persistent
    max-width="500px"
  >
    <template #default>
      <p class="text-body-1 mb-4">
        {{ message || 'Access to this feature or continued usage requires an active subscription or payment.' }}
      </p>
      <p v-if="additionalDetails" class="text-caption text-grey">
        {{ additionalDetails }}
      </p>
    </template>

    <template #actions>
      <v-spacer></v-spacer>
      <v-btn
        text
        @click="$emit('update:modelValue', false)"
        v-if="showCloseButton"
      >
        {{ closeButtonText }}
      </v-btn>
      <v-btn
        color="primary"
        variant="elevated"
        @click="handlePrimaryAction"
        :loading="isLoading"
      >
        {{ primaryActionText }}
      </v-btn>
    </template>
  </BaseDialog>
</template>

<script setup>
import BaseDialog from '@/components/common/BaseDialog.vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  modelValue: { // For v-model
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: 'Your current plan does not cover this action or your usage limits have been exceeded.',
  },
  additionalDetails: {
    type: String,
    default: '',
  },
  primaryActionText: {
    type: String,
    default: 'Go to Billing',
  },
  primaryActionRoute: { // Route to navigate to on primary action
    type: [String, Object],
    default: '/billing',
  },
  showCloseButton: {
    type: Boolean,
    default: true,
  },
  closeButtonText: {
      type: String,
      default: 'Later'
  },
  isLoading: { // If primary action involves async operation
      type: Boolean,
      default: false,
  }
});

const emit = defineEmits(['update:modelValue', 'primaryAction']);

const router = useRouter();

function handlePrimaryAction() {
  emit('primaryAction'); // Emit event for parent to handle if needed
  if (props.primaryActionRoute) {
    router.push(props.primaryActionRoute);
  }
  emit('update:modelValue', false); // Close dialog after action
}

// This dialog is typically triggered globally.
// A global store (e.g., appStore or authStore) might have a state like `isPaymentRequiredDialogOpen = true`
// and `paymentRequiredMessage = 'Your message'`.
// App.vue would watch this state and show this dialog.
// Example:
// In authStore:
// state: () => ({ ..., showPaymentDialog: false, paymentDialogMessage: '' })
// actions: { triggerPaymentDialog(message) { this.paymentDialogMessage = message; this.showPaymentDialog = true; } }
//
// In App.vue:
// <PaymentRequiredDialog v-model="authStore.showPaymentDialog" :message="authStore.paymentDialogMessage" />
</script>

<style scoped>
/* Add specific styles if needed */
</style>
