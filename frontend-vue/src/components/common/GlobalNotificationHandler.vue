<template>
  <div class="global-notification-handler">
    <v-snackbar
      v-for="(notification, index) in notifications"
      :key="notification.id"
      v-model="notification.visible"
      :color="notificationTypeColor(notification.type)"
      :timeout="notification.timeout === 0 ? -1 : notification.timeout"
      :location="snackbarLocation"
      :multi-line="notification.message.length > 70"
      :closable="notification.closable"
      @update:modelValue="(value) => { if (!value) removeNotification(notification.id) }"
      class="ma-1"
      style="z-index: 9999;"
    >
      <div class="d-flex align-center">
        <v-icon v-if="notificationIcon(notification.type)" :icon="notificationIcon(notification.type)" class="mr-3"></v-icon>
        <div>
          <div v-if="notification.title" class="font-weight-medium">{{ notification.title }}</div>
          <div>{{ notification.message }}</div>
        </div>
      </div>
      <template v-slot:actions v-if="notification.closable">
        <v-btn
          variant="text"
          icon="mdi-close"
          @click="removeNotification(notification.id)"
          size="small"
        ></v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useNotificationsStore } from '@/store/notifications';

const notificationsStore = useNotificationsStore();

// Local reactive copy of notifications with a 'visible' property for v-snackbar
const notifications = ref([]);

const snackbarLocation = computed(() => {
    // Example: use Vuetify's display composable if you want to change location based on screen size
    // const { mobile } = useDisplay();
    // return mobile.value ? 'bottom' : 'top end';
    return 'top end'; // Default location
});

watch(() => notificationsStore.getNotifications, (newNotifs) => {
  // Sync local notifications with store, adding 'visible' property
  // This approach ensures v-snackbar's v-model works correctly for each notification.

  // Remove local notifications that are no longer in the store
  notifications.value = notifications.value.filter(ln =>
    newNotifs.some(sn => sn.id === ln.id)
  );

  // Add new notifications from store or update existing ones
  newNotifs.forEach(sn => {
    const localNotif = notifications.value.find(ln => ln.id === sn.id);
    if (!localNotif) {
      notifications.value.push({ ...sn, visible: true });
    } else {
      // Update existing if necessary (though message/type usually don't change post-creation)
      // localNotif.message = sn.message;
      // localNotif.type = sn.type;
      // localNotif.visible = true; // Ensure it's visible if re-added or updated
    }
  });
}, { deep: true });


function removeNotification(id) {
  notificationsStore.removeNotification(id);
}

function notificationTypeColor(type) {
  switch (type) {
    case 'success': return 'success'; // Vuetify success color
    case 'error': return 'error';     // Vuetify error color
    case 'warning': return 'warning'; // Vuetify warning color
    case 'info': return 'info';       // Vuetify info color
    default: return 'primary';      // Default color
  }
}

function notificationIcon(type) {
  switch (type) {
    case 'success': return 'mdi-check-circle-outline';
    case 'error': return 'mdi-alert-circle-outline';
    case 'warning': return 'mdi-alert-outline';
    case 'info': return 'mdi-information-outline';
    default: return null;
  }
}

</script>

<style scoped>
.global-notification-handler {
  position: fixed; /* Or use v-layout if Vuetify manages this */
  /* Adjust positioning as needed if not using v-layout for snackbars */
  /* z-index: 9999; */
}
/* Ensure snackbars stack nicely if multiple appear */
.v-snackbar--stacked {
    bottom: unset !important; /* Override default bottom if using top location */
}
</style>
