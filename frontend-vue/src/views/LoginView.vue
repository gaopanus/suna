<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Login</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form @submit.prevent="handleLogin" ref="loginForm">
              <v-alert
                v-if="authStore.authError"
                type="error"
                density="compact"
                class="mb-4"
                closable
                @click:close="authStore.clearError()"
              >
                {{ authStore.authError.message }}
              </v-alert>

              <v-text-field
                v-model="email"
                label="Email"
                name="email"
                prepend-icon="mdi-email"
                type="email"
                required
                :rules="[rules.required, rules.email]"
                @input="authStore.clearError()"
              ></v-text-field>

              <v-text-field
                v-model="password"
                label="Password"
                name="password"
                prepend-icon="mdi-lock"
                type="password"
                required
                :rules="[rules.required, rules.minPassword]"
                @input="authStore.clearError()"
              ></v-text-field>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn type="submit" color="primary" :loading="authStore.isLoading">Login</v-btn>
              </v-card-actions>
               <v-row class="mt-4" justify="center">
                <p>
                  Don't have an account? <router-link to="/signup">Sign Up</router-link>
                </p>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const loginForm = ref(null); // Ref for the form to trigger validation

const authStore = useAuthStore();
const router = useRouter();

const rules = {
  required: value => !!value || 'Required.',
  email: value => /.+@.+\..+/.test(value) || 'E-mail must be valid.',
  minPassword: value => (value && value.length >= 6) || 'Password must be at least 6 characters.',
};

async function handleLogin() {
  authStore.clearError(); // Clear previous errors
  const { valid } = await loginForm.value.validate(); // Vuetify form validation

  if (!valid) {
    return;
  }

  try {
    await authStore.login({ email: email.value, password: password.value });
    // The onAuthStateChange listener in auth.js store will redirect to '/' if login is successful
    // and the user is on the login page. Or, you can explicitly navigate here.
    // For example, if onAuthStateChange doesn't handle all redirection scenarios:
    if (authStore.isAuthenticated) {
      router.push('/');
    }
  } catch (error) {
    console.error('Login failed in component:', error.message);
    // Error is already set in the store and displayed by v-alert
  }
}
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
  padding-top: 0;
  padding-bottom: 0;
}
</style>
