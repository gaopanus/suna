<template>
  <v-form @submit.prevent="submitMessage" class="chat-input-form pa-2">
    <v-textarea
      v-model="newMessage"
      label="Type your message..."
      rows="2"
      max-rows="5"
      auto-grow
      outlined
      dense
      hide-details="auto"
      append-icon="mdi-send"
      @click:append="submitMessage"
      @keydown.enter.exact.prevent="submitMessage"
      :disabled="isSendingMessage || disabled"
      class="message-textarea"
    ></v-textarea>
    <!-- Alternatively, use v-text-field with an icon button -->
    <!--
    <v-text-field
      v-model="newMessage"
      label="Type your message..."
      outlined
      dense
      hide-details
      append-inner-icon="mdi-send"
      @click:append-inner="submitMessage"
      @keydown.enter.prevent="submitMessage"
      :disabled="isSendingMessage || disabled"
    >
       <template v-slot:append>
        <v-btn
          icon="mdi-send"
          @click="submitMessage"
          :loading="isSendingMessage"
          :disabled="!newMessage.trim() || disabled"
          variant="text"
        ></v-btn>
      </template>
    </v-text-field>
    -->
  </v-form>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  isSendingMessage: {
    type: Boolean,
    default: false
  },
  disabled: { // For disabling input, e.g., while agent is running without interruption
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['sendMessage']);

const newMessage = ref('');

const submitMessage = () => {
  if (newMessage.value.trim() === '' || props.isSendingMessage || props.disabled) {
    return;
  }
  emit('sendMessage', newMessage.value.trim());
  newMessage.value = ''; // Clear input after sending
};
</script>

<style scoped>
.chat-input-form {
  background-color: rgb(var(--v-theme-surface)); /* Use Vuetify theme surface color */
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  /* position: sticky;
  bottom: 0;
  z-index: 1; */
}
.message-textarea {
    max-height: 150px; /* Limit growth of textarea */
    overflow-y: auto;
}
</style>
