<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h5">
            Billing & Subscription
          </v-card-title>
          <v-card-text>
            <p class="text-body-1 mb-4">
              Manage your subscription, view payment history, and update billing details.
            </p>

            <div v-if="isLoadingSubscription">
              <v-progress-linear indeterminate color="primary" class="mb-3"></v-progress-linear>
              <p class="text-center">Loading subscription details...</p>
            </div>

            <v-alert v-if="apiError" type="error" class="mb-4">
              {{ apiError.message || 'Failed to load billing information.' }}
            </v-alert>

            <div v-if="subscription && !isLoadingSubscription">
              <h3 class="text-h6">Current Plan: {{ subscription.plan_name || 'N/A' }}</h3>
              <p>Status: <v-chip :color="statusColor(subscription.status)" size="small" label>{{ subscription.status }}</v-chip></p>
              <p v-if="subscription.current_period_end">
                Renews on: {{ formatDate(subscription.current_period_end, { month: 'long', day: 'numeric', year: 'numeric' }) }}
              </p>
              <p v-if="subscription.trial_end">
                Trial ends on: {{ formatDate(subscription.trial_end, { month: 'long', day: 'numeric', year: 'numeric' }) }}
              </p>
              <p v-if="subscription.cancel_at_period_end" class="text-warning">
                Subscription will be cancelled at the end of the current period.
              </p>
               <p v-if="subscription.has_schedule && subscription.scheduled_plan_name">
                Changing to: {{ subscription.scheduled_plan_name }} on {{ formatDate(subscription.schedule_effective_date, { month: 'long', day: 'numeric', year: 'numeric' }) }}
              </p>

              <!-- Usage (Example) -->
              <div v-if="subscription.minutes_limit !== undefined && subscription.minutes_limit !== null" class="mt-3">
                <p>Usage: {{ subscription.current_usage || 0 }} / {{ subscription.minutes_limit }} minutes</p>
                <v-progress-linear
                    :model-value="(subscription.current_usage || 0) / (subscription.minutes_limit || 1) * 100"
                    color="primary"
                    height="10"
                    rounded
                ></v-progress-linear>
              </div>
            </div>
             <div v-else-if="!isLoadingSubscription && !apiError">
                <p>No active subscription found.</p>
            </div>


            <v-divider class="my-6"></v-divider>

            <h3 class="text-h6 mb-3">Manage Subscription</h3>
            <p class="text-body-2 mb-3">
              You will be redirected to our secure payment provider (Stripe) to manage your subscription.
            </p>
            <v-btn
                color="primary"
                @click="handleManageSubscription"
                :loading="isManagingSubscription"
                :disabled="isLoadingSubscription"
            >
              Manage Subscription & Billing
            </v-btn>
             <p class="text-caption mt-2">This includes changing plans, updating payment methods, or cancelling your subscription.</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
// Assume these API functions will be added to services/api.js to interact with your backend's billing endpoints
// For now, these are placeholders.
// import { getSubscription, createPortalSession } from '@/services/api';
import { useNotificationsStore } from '@/store/notifications';
import { formatDate } from '@/utils/formatters'; // Import the formatter

const notificationsStore = useNotificationsStore();

const subscription = ref(null); // Stores SubscriptionStatus object
const isLoadingSubscription = ref(false);
const isManagingSubscription = ref(false);
const apiError = ref(null); // { message: string }

// Placeholder API functions - these should be implemented in services/api.js
// and call your backend, which then interacts with Stripe.
async function getSubscription() {
  console.warn("Using placeholder getSubscription. Implement in services/api.js");
  // Example:
  // const response = await apiClient.get('/billing/subscription');
  // return response.data;
  return new Promise(resolve => setTimeout(() => resolve({
    status: 'active', // 'trialing', 'past_due', 'no_subscription'
    plan_name: 'Pro Plan',
    price_id: 'price_123abc',
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // ~30 days from now
    cancel_at_period_end: false,
    trial_end: null, // or a date string
    minutes_limit: 1000,
    current_usage: 250,
    has_schedule: false,
    scheduled_plan_name: null,
    schedule_effective_date: null,
  }), 1000));
}

async function createPortalSession() {
  console.warn("Using placeholder createPortalSession. Implement in services/api.js");
  // Example:
  // const response = await apiClient.post('/billing/create-portal-session', { return_url: window.location.href });
  // return response.data; // expecting { url: 'stripe_portal_url' }
  return new Promise(resolve => setTimeout(() => resolve({
    url: 'https://stripe.com/test_portal_session_url_replace_me'
  }), 1000));
}


async function fetchSubscriptionDetails() {
  isLoadingSubscription.value = true;
  apiError.value = null;
  try {
    subscription.value = await getSubscription();
  } catch (error) {
    console.error('Failed to fetch subscription details:', error);
    apiError.value = { message: error.message || 'Could not load subscription information.' };
    notificationsStore.showError(apiError.value.message);
  } finally {
    isLoadingSubscription.value = false;
  }
}

async function handleManageSubscription() {
  isManagingSubscription.value = true;
  apiError.value = null;
  try {
    const portalData = await createPortalSession();
    if (portalData && portalData.url) {
      window.location.href = portalData.url; // Redirect to Stripe Customer Portal
    } else {
      throw new Error('Could not retrieve billing portal URL.');
    }
  } catch (error) {
    console.error('Failed to create portal session:', error);
    apiError.value = { message: error.message || 'Could not open billing management page.' };
    notificationsStore.showError(apiError.value.message);
  } finally {
    isManagingSubscription.value = false;
  }
}

function statusColor(status) {
  switch (status?.toLowerCase()) {
    case 'active': return 'success';
    case 'trialing': return 'info';
    case 'past_due': return 'error';
    case 'canceled':
    case 'cancelled': return 'grey';
    case 'unpaid': return 'warning';
    default: return 'default';
  }
}

onMounted(() => {
  fetchSubscriptionDetails();
});
</script>

<style scoped>
/* Add specific styles if needed */
</style>
