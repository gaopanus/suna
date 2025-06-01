import { defineStore } from 'pinia';
import {
  getSubscriptionDetails,
  listInvoices as apiListInvoices,
  createBillingPortalSession as apiCreateBillingPortalSession,
  getUsageDetails as apiGetUsageDetails,
} from '@/services/api';
import { useNotificationsStore } from './notifications';

export const useBillingStore = defineStore('billing', {
  state: () => ({
    subscription: null, // E.g., { id, plan_name, status, current_period_end, price, cancel_at_period_end, trial_end }
    invoices: [],     // E.g., [{ id, date, amount_paid, status, invoice_pdf_url }]
    usage: null,      // E.g., { agentRuns: { used, limit }, messages: { used, limit } }

    isLoadingSubscription: false,
    isLoadingInvoices: false,
    isLoadingUsage: false,
    isRedirectingToPortal: false,

    billingError: null, // { message, details, operation }
  }),

  getters: {
    activeSubscription: (state) => state.subscription,
    invoiceList: (state) => state.invoices,
    currentUsage: (state) => state.usage,

    // Example: Check if user is on a paid plan and it's active
    hasActivePaidSubscription: (state) => {
      return state.subscription &&
             state.subscription.status === 'active' &&
             !state.subscription.cancel_at_period_end &&
             state.subscription.price_id && !state.subscription.price_id.includes('free'); // Example check
    },
    isTrialing: (state) => state.subscription?.status === 'trialing',
  },

  actions: {
    clearError() {
      this.billingError = null;
    },

    async fetchSubscriptionDetails() {
      this.isLoadingSubscription = true;
      this.billingError = null;
      const notifications = useNotificationsStore();
      try {
        const data = await getSubscriptionDetails();
        this.subscription = data; // Assuming API returns the subscription object directly
      } catch (error) { // error is already processed by handleApiError
        console.error('Error fetching subscription details in store:', error);
        this.billingError = { ...error, operation: 'fetchSubscriptionDetails' };
        this.subscription = null;
        // No global notification here, let UI decide based on error if needed
      } finally {
        this.isLoadingSubscription = false;
      }
    },

    async fetchInvoices(params = {}) {
      this.isLoadingInvoices = true;
      this.billingError = null;
      const notifications = useNotificationsStore();
      try {
        // Assuming apiListInvoices returns an array of invoices
        // The API might return { data: [], has_more: false } for Stripe-like pagination
        const invoicesData = await apiListInvoices(params);
        this.invoices = invoicesData; // Or invoicesData.data if nested
      } catch (error) {
        console.error('Error fetching invoices in store:', error);
        this.billingError = { ...error, operation: 'fetchInvoices' };
        this.invoices = [];
        notifications.showError(this.billingError.message || 'Could not load invoice history.');
      } finally {
        this.isLoadingInvoices = false;
      }
    },

    async fetchUsageDetails() {
      this.isLoadingUsage = true;
      this.billingError = null;
      const notifications = useNotificationsStore();
      try {
        const data = await apiGetUsageDetails();
        this.usage = data; // Assuming API returns the usage object directly
      } catch (error) {
        console.error('Error fetching usage details in store:', error);
        this.billingError = { ...error, operation: 'fetchUsageDetails' };
        this.usage = null;
        // No global notification here, let UI decide
      } finally {
        this.isLoadingUsage = false;
      }
    },

    async redirectToBillingPortal() {
      this.isRedirectingToPortal = true;
      this.billingError = null;
      const notifications = useNotificationsStore();
      try {
        const portalData = await apiCreateBillingPortalSession();
        if (portalData && portalData.url) {
          window.location.href = portalData.url; // Redirect to Stripe Customer Portal
        } else {
          throw new Error('Could not retrieve billing portal URL.');
        }
      } catch (error) {
        console.error('Error redirecting to billing portal in store:', error);
        this.billingError = { ...error, operation: 'redirectToBillingPortal' };
        notifications.showError(this.billingError.message || 'Could not open billing management page.');
        // Do not re-throw here as it's a redirect action, component doesn't need to catch it.
      } finally {
        this.isRedirectingToPortal = false;
      }
    },

    // Action to clear billing data, e.g., on logout
    clearBillingData() {
        this.subscription = null;
        this.invoices = [];
        this.usage = null;
        this.billingError = null;
        console.log('BillingStore: Data cleared.');
    }
  },
});
