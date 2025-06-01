<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Sign Up</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form @submit.prevent="handleSignup" ref="signupForm">
              <v-alert
                v-if="authStore.authError"
                :type="authStore.authError.isConfirmationPending ? 'info' : 'error'"
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

              <v-text-field
                v-model="confirmPassword"
                label="Confirm Password"
                name="confirmPassword"
                prepend-icon="mdi-lock-check"
                type="password"
                required
                :rules="[rules.required, rules.passwordMatch]"
                @input="authStore.clearError()"
              ></v-text-field>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn type="submit" color="primary" :loading="authStore.isLoading">Sign Up</v-btn>
              </v-card-actions>
              <v-row class="mt-4" justify="center">
                <p>
                  Already have an account? <router-link to="/login">Login</router-link>
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
const confirmPassword = ref('');
const signupForm = ref(null); // Ref for the form

const authStore = useAuthStore();
const router = useRouter();

const rules = {
  required: value => !!value || 'Required.',
  email: value => /.+@.+\..+/.test(value) || 'E-mail must be valid.',
  minPassword: value => (value && value.length >= 6) || 'Password must be at least 6 characters.',
  passwordMatch: value => (value === password.value) || 'Passwords do not match.',
};

async function handleSignup() {
  authStore.clearError();
  const { valid } = await signupForm.value.validate();

  if (!valid) {
    return;
  }

  try {
    const signupData = await authStore.signup({ email: email.value, password: password.value });
    // If signup is successful and requires email confirmation, the message is in authStore.authError.
    // If auto-confirmation is on, user might be logged in.
    if (signupData.session) { // User is logged in immediately
      router.push('/');
    } else if (signupData.user && authStore.authError?.isConfirmationPending) {
      // User created, confirmation pending. Stay on page or redirect to a specific info page.
      // The v-alert will show the confirmation message.
      console.log('Signup successful, confirmation pending.');
    } else if (!signupData.user && !authStore.authError) {
        // This case should ideally not happen if Supabase returns user data on success
        authStore.error = { message: 'Signup process initiated. Please check your email.' };
    }
  } catch (error) {
    console.error('Signup failed in component:', error.message);
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
