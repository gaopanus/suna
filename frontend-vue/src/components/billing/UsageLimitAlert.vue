<template>
  <div v-if="shouldShowAlert" class="usage-limit-alert my-3">
    <v-alert
      :type="alertType"
      variant="tonal"
      border="start"
      prominent
      closable
      @click:close="dismissAlert"
      v-model="showAlert"
    >
      <template #title v-if="alertTitle">
        {{ alertTitle }}
      </template>

      <div class="text-body-2">
        {{ alertMessage }}
        <span v-if="usageData.limit > 0">
          You have used <strong>{{ usageData.used }} / {{ usageData.limit }}</strong> {{ usageData.resourceName || 'units' }}.
        </span>
        <span v-else-if="usageData.used > 0 && usageData.limit === 0">
            You have used <strong>{{ usageData.used }}</strong> {{ usageData.resourceName || 'units' }} (no specific limit defined for this resource, but usage is tracked).
        </span>
      </div>

      <template #append v-if="showUpgradeButton">
        <v-btn color="primary" variant="elevated" size="small" class="ml-4" :to="upgradeLink || '/billing'">
          {{ upgradeButtonText }}
        </v-btn>
      </template>
    </v-alert>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  usageData: { // E.g., { used: 80, limit: 100, resourceName: 'Agent Runs' }
    type: Object,
    required: true,
    validator: (value) => {
      return typeof value.used === 'number' && typeof value.limit === 'number' && value.used >= 0 && value.limit >= 0;
    }
  },
  thresholdPercentage: { // Percentage at which to show a warning
    type: Number,
    default: 80, // Show warning at 80% usage
  },
  criticalPercentage: { // Percentage at which to show an error/critical warning
    type: Number,
    default: 95, // Show error/critical at 95% usage
  },
  upgradeLink: { // Optional link for an upgrade button
      type: [String, Object], // Can be a string path or a router link object
      default: '/billing'
  },
  upgradeButtonText: {
      type: String,
      default: "Upgrade Plan"
  },
  showUpgradeButton: {
      type: Boolean,
      default: true,
  }
});

const showAlert = ref(true); // Controls visibility, allows user to dismiss

const usagePercentage = computed(() => {
  if (props.usageData.limit === 0) {
      // If limit is 0, it could mean unlimited or not applicable for percentage calculation.
      // Let's assume usage > 0 with limit 0 is just for tracking, not for alerts based on percentage.
      // Or, if a resource has a limit of 0 but usage is >0, it's effectively over limit.
      return props.usageData.used > 0 ? Infinity : 0;
  }
  return (props.usageData.used / props.usageData.limit) * 100;
});

const shouldShowAlert = computed(() => {
  if (!showAlert.value) return false; // If dismissed by user
  if (props.usageData.limit === 0) {
      // Only show if usage exists and limit is 0 (meaning any usage is notable or over an implicit limit)
      // This behavior might need to be customized based on specific business logic for "limit 0".
      // For now, let's not show percentage-based alerts if limit is 0 unless usage > 0.
      return props.usageData.used > 0;
  }
  return usagePercentage.value >= props.thresholdPercentage;
});

const alertType = computed(() => {
  if (props.usageData.limit === 0 && props.usageData.used > 0) return 'warning'; // Or 'error' if it means over limit
  if (usagePercentage.value >= props.criticalPercentage) return 'error';
  if (usagePercentage.value >= props.thresholdPercentage) return 'warning';
  return 'info'; // Should not be shown due to shouldShowAlert logic, but as a fallback
});

const alertTitle = computed(() => {
  const resource = props.usageData.resourceName || 'Resource';
  if (props.usageData.limit === 0 && props.usageData.used > 0) return `${resource} Usage Alert`;
  if (usagePercentage.value >= props.criticalPercentage) return `Critical ${resource} Limit Reached`;
  if (usagePercentage.value >= props.thresholdPercentage) return `${resource} Limit Nearing`;
  return null;
});

const alertMessage = computed(() => {
  const resource = props.usageData.resourceName || 'resource';
  if (props.usageData.limit === 0 && props.usageData.used > 0) {
      return `You are currently using the ${resource}. Please monitor your usage.`;
  }
  if (usagePercentage.value >= props.criticalPercentage) {
    return `You have reached or exceeded your limit for ${resource}. Some features may be restricted.`;
  }
  if (usagePercentage.value >= props.thresholdPercentage) {
    return `You are nearing your usage limit for ${resource}.`;
  }
  return ''; // Default, should not be shown
});

function dismissAlert() {
  showAlert.value = false;
  // Optionally, emit an event or store dismissal preference
}

// Watch for usageData changes to reset showAlert if it was previously dismissed
// and the condition to show it is met again.
watch(() => props.usageData, () => {
    // If the alert condition is met again, make it visible.
    // This is useful if the user dismisses it, then usage changes.
    if (props.usageData.limit === 0 && props.usageData.used > 0) {
        showAlert.value = true;
    } else if (props.usageData.limit > 0 && (props.usageData.used / props.usageData.limit * 100) >= props.thresholdPercentage) {
        showAlert.value = true;
    }
    // If it was dismissed and condition is no longer met, it remains dismissed (showAlert.value is false)
}, { deep: true });

</script>

<style scoped>
/* Add any specific styles if needed */
</style>
