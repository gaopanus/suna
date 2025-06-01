<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="10" lg="8">
        <h1 class="text-h4 mb-2">Billing & Subscription</h1>
        <p class="text-subtitle-1 text-grey mb-6">
          Manage your subscription, view payment history, and monitor usage.
        </p>

        <!-- Subscription Details Section -->
        <v-card class="mb-6" :loading="billingStore.isLoadingSubscription">
          <v-card-title class="text-h6 d-flex justify-space-between align-center">
            <span>Current Subscription</span>
            <v-chip
                v-if="billingStore.subscription?.status"
                :color="statusColor(billingStore.subscription.status)"
                size="small"
                label
                class="font-weight-medium"
            >
                {{ billingStore.subscription.status }}
            </v-chip>
          </v-card-title>
          <v-divider></v-divider>

          <div v-if="billingStore.isLoadingSubscription && !billingStore.subscription" class="pa-4 text-center">
            <v-progress-circular indeterminate color="primary" class="my-3"></v-progress-circular>
            <p>Loading subscription details...</p>
          </div>
          <v-alert
            v-else-if="billingStore.billingError && billingStore.billingError.operation === 'fetchSubscriptionDetails'"
            type="error"
            class="ma-4"
            variant="tonal"
          >
            {{ billingStore.billingError.message || 'Failed to load subscription information.' }}
          </v-alert>
          <v-card-text v-else-if="billingStore.subscription">
            <v-row>
              <v-col cols="12" sm="6">
                <p class="font-weight-medium">Plan:</p>
                <p class="text-h5">{{ billingStore.subscription.plan_name || 'N/A' }}</p>
              </v-col>
              <v-col cols="12" sm="6" v-if="billingStore.subscription.current_period_end">
                <p class="font-weight-medium">{{ billingStore.subscription.cancel_at_period_end ? 'Expires on:' : 'Renews on:' }}</p>
                <p>{{ formatDate(billingStore.subscription.current_period_end, { month: 'long', day: 'numeric', year: 'numeric' }) }}</p>
              </v-col>
            </v-row>
            <p v-if="billingStore.subscription.trial_end" class="mt-2 text-info">
              <v-icon small color="info">mdi-information-outline</v-icon>
              Your trial ends on: {{ formatDate(billingStore.subscription.trial_end, { month: 'long', day: 'numeric', year: 'numeric' }) }}
            </p>
            <p v-if="billingStore.subscription.cancel_at_period_end" class="mt-2 text-warning">
               <v-icon small color="warning">mdi-alert-outline</v-icon>
              Your subscription will be cancelled at the end of the current period and will not renew.
            </p>
            <p v-if="billingStore.subscription.has_schedule && billingStore.subscription.scheduled_plan_name" class="mt-2 text-info">
                <v-icon small color="info">mdi-clock-outline</v-icon>
                Your plan will change to <strong>{{ billingStore.subscription.scheduled_plan_name }}</strong> on
                {{ formatDate(billingStore.subscription.schedule_effective_date, { month: 'long', day: 'numeric', year: 'numeric' }) }}.
            </p>
          </v-card-text>
          <v-card-text v-else>
            <p>No active subscription found. Please choose a plan to get started.</p>
          </v-card-text>
           <v-card-actions class="pa-4">
              <v-btn
                color="primary"
                variant="elevated"
                @click="handleManageSubscription"
                :loading="billingStore.isRedirectingToPortal"
              >
                Manage Subscription & Payment
              </v-btn>
            </v-card-actions>
        </v-card>

        <!-- Usage Section -->
        <v-card class="mb-6" :loading="billingStore.isLoadingUsage">
          <v-card-title class="text-h6">Usage Overview</v-card-title>
          <v-divider></v-divider>
           <div v-if="billingStore.isLoadingUsage && !billingStore.usage" class="pa-4 text-center">
            <v-progress-circular indeterminate color="primary" class="my-3"></v-progress-circular>
            <p>Loading usage details...</p>
          </div>
          <v-alert
            v-else-if="billingStore.billingError && billingStore.billingError.operation === 'fetchUsageDetails'"
            type="error"
            class="ma-4"
            variant="tonal"
          >
            {{ billingStore.billingError.message || 'Failed to load usage information.' }}
          </v-alert>
          <v-card-text v-else-if="billingStore.usage">
            <!-- Example Usage: Agent Runs -->
            <UsageLimitAlert
                v-if="billingStore.usage.agentRuns"
                :usage-data="{
                    used: billingStore.usage.agentRuns.used,
                    limit: billingStore.usage.agentRuns.limit,
                    resourceName: 'Agent Runs'
                }"
                :threshold-percentage="80"
                :critical-percentage="95"
                class="mb-3"
            />
            <!-- Example Usage: Messages -->
            <UsageLimitAlert
                v-if="billingStore.usage.messages"
                :usage-data="{
                    used: billingStore.usage.messages.used,
                    limit: billingStore.usage.messages.limit,
                    resourceName: 'Messages Processed'
                }"
                class="mb-3"
            />
            <!-- Add more usage metrics as needed -->
            <div v-if="!billingStore.usage.agentRuns && !billingStore.usage.messages" class="text-grey">
                No specific usage metrics available for your current plan or usage is zero.
            </div>
          </v-card-text>
          <v-card-text v-else>
            <p>Usage information is currently unavailable.</p>
          </v-card-text>
        </v-card>

        <!-- Invoice History Section -->
        <v-card :loading="billingStore.isLoadingInvoices">
          <v-card-title class="text-h6">Invoice History</v-card-title>
          <v-divider></v-divider>
          <div v-if="billingStore.isLoadingInvoices && billingStore.invoices.length === 0" class="pa-4 text-center">
            <v-progress-circular indeterminate color="primary" class="my-3"></v-progress-circular>
            <p>Loading invoice history...</p>
          </div>
           <v-alert
            v-else-if="billingStore.billingError && billingStore.billingError.operation === 'fetchInvoices'"
            type="error"
            class="ma-4"
            variant="tonal"
          >
            {{ billingStore.billingError.message || 'Failed to load invoice history.' }}
          </v-alert>
          <v-card-text v-if="billingStore.invoices.length > 0">
            <v-table density="compact">
              <thead>
                <tr>
                  <th class="text-left">Date</th>
                  <th class="text-left">Amount</th>
                  <th class="text-left">Status</th>
                  <th class="text-left">Invoice #</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="invoice in billingStore.invoiceList" :key="invoice.id">
                  <td>{{ formatDate(invoice.date * 1000) }}</td> <!-- Assuming Stripe date is seconds timestamp -->
                  <td>${{ (invoice.amount_paid / 100).toFixed(2) }} {{ invoice.currency.toUpperCase() }}</td>
                  <td><v-chip :color="statusColor(invoice.status)" size="small" label>{{ invoice.status }}</v-chip></td>
                  <td>{{ invoice.number || invoice.id.substring(0,12) }}</td>
                  <td class="text-right">
                    <v-btn
                        v-if="invoice.invoice_pdf_url"
                        :href="invoice.invoice_pdf_url"
                        target="_blank"
                        icon="mdi-file-pdf-box"
                        variant="text"
                        color="primary"
                        size="small"
                        title="Download PDF"
                    ></v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
            <!-- Add pagination if API supports it -->
          </v-card-text>
          <v-card-text v-else-if="!billingStore.isLoadingInvoices && !(billingStore.billingError && billingStore.billingError.operation === 'fetchInvoices')">
            <p>No invoices found.</p>
          </v-card-text>
        </v-card>

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { onMounted } from 'vue';
import { useBillingStore } from '@/store/billingStore';
import { formatDate } from '@/utils/formatters';
import UsageLimitAlert from '@/components/billing/UsageLimitAlert.vue';
// PaymentRequiredDialog is usually triggered globally, not directly placed here unless specifically needed.

const billingStore = useBillingStore();

onMounted(() => {
  billingStore.clearError(); // Clear previous errors
  billingStore.fetchSubscriptionDetails();
  billingStore.fetchInvoices(); // TODO: Add pagination params if needed
  billingStore.fetchUsageDetails();
});

function handleManageSubscription() {
  billingStore.redirectToBillingPortal();
}

function statusColor(status) {
  const s = status?.toLowerCase();
  if (s === 'paid' || s === 'active' || s === 'succeeded') return 'success';
  if (s === 'open' || s === 'pending' || s === 'trialing') return 'info';
  if (s === 'past_due' || s === 'failed') return 'error';
  if (s === 'void' || s === 'uncollectible' || s === 'canceled' || s === 'cancelled') return 'grey';
  return 'default';
}
</script>

<style scoped>
/* Add specific styles if needed */
</style>
