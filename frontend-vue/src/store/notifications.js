import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    notifications: [], // Array of notification objects
  }),

  getters: {
    // activeNotifications: (state) => state.notifications, // Simple getter if no transformation needed
    // Or if you want to filter out already "processed" or non-visible notifications (future enhancement)
    getNotifications: (state) => state.notifications,
  },

  actions: {
    /**
     * Adds a notification to the store.
     * @param {Object} notificationData
     * @param {string} notificationData.message - The message to display.
     * @param {'success' | 'error' | 'info' | 'warning'} [notificationData.type='info'] - Type of notification.
     * @param {number} [notificationData.timeout=5000] - Duration in ms. 0 for persistent.
     * @param {boolean} [notificationData.closable=true] - If the notification can be closed by user.
     * @param {string} [notificationData.title] - Optional title for the notification.
     */
    addNotification(notificationData) {
      const newNotification = {
        id: uuidv4(),
        message: notificationData.message,
        type: notificationData.type || 'info',
        timeout: notificationData.timeout === undefined ? 5000 : notificationData.timeout, // Default 5s, 0 for persistent
        closable: notificationData.closable === undefined ? true : notificationData.closable,
        title: notificationData.title || null,
        createdAt: Date.now(),
        // You can add other properties like actions, icons etc.
      };
      this.notifications.push(newNotification);

      // If timeout is set and > 0, automatically remove it later
      // This is handled by v-snackbar's timeout, but good for store cleanup if snackbar fails
      if (newNotification.timeout > 0) {
        setTimeout(() => {
          // Check if notification still exists before removing,
          // user might have closed it manually.
          if (this.notifications.find(n => n.id === newNotification.id)) {
            this.removeNotification(newNotification.id);
          }
        }, newNotification.timeout + 500); // Add a small buffer
      }
    },

    /**
     * Removes a notification by its ID.
     * @param {string} notificationId
     */
    removeNotification(notificationId) {
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
    },

    // Convenience methods
    showSuccess(message, options = {}) {
      this.addNotification({ message, type: 'success', ...options });
    },
    showError(message, options = {}) {
      // Errors often should persist longer or require manual dismissal
      const defaults = { timeout: 7000, closable: true };
      this.addNotification({ message, type: 'error', ...defaults, ...options });
    },
    showInfo(message, options = {}) {
      this.addNotification({ message, type: 'info', ...options });
    },
    showWarning(message, options = {}) {
      const defaults = { timeout: 6000 };
      this.addNotification({ message, type: 'warning', ...defaults, ...options });
    },
  },
});

// Example Usage in another store or component:
// import { useNotificationsStore } from '@/store/notifications';
//
// setup() {
//   const notificationsStore = useNotificationsStore();
//
//   function someAction() {
//     try {
//       // ... do something ...
//       notificationsStore.showSuccess('Operation completed successfully!');
//     } catch (e) {
//       notificationsStore.showError(`Operation failed: ${e.message}`);
//     }
//   }
//   return { someAction };
// }
