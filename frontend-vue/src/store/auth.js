import { defineStore } from 'pinia';
import { supabase } from '@/services/supabaseClient';
import router from '@/router';
import { useNotificationsStore } from './notifications';

const SESSION_STORAGE_KEY = 'supabase_session';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || 'null'),
    loading: false,
    error: null, // Will be an object like { message: string, status?: number, details?: any }
  }),
  getters: {
    isAuthenticated: (state) => !!state.user && !!state.session,
    currentUser: (state) => state.user,
    isLoading: (state) => state.loading,
    authError: (state) => state.error,
    userDisplayName: (state) => state.user?.user_metadata?.full_name || state.user?.email,
  },
  actions: {
    _clearAuthState() {
      this.user = null;
      this.session = null;
      localStorage.removeItem(SESSION_STORAGE_KEY);
    },

    async initializeAuthListener() {
      if (this.session?.user) {
        this.user = this.session.user;
      } else if (this.session) {
        this._clearAuthState();
      }

      supabase.auth.onAuthStateChange((event, newSession) => {
        console.log('Auth state changed:', event, newSession);
        this.session = newSession;
        this.user = newSession?.user || null;
        this.loading = false;
        this.error = null;

        if (newSession) {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
        } else {
          this._clearAuthState();
        }

        if (event === 'SIGNED_OUT') {
          if (router.currentRoute.value.meta.requiresAuth) {
            router.push({ name: 'Login', query: { loggedOut: 'true' } });
          }
        } else if (event === 'SIGNED_IN') {
          const redirectPath = router.currentRoute.value.query.redirect || '/projects'; // Default to /projects
           // Only redirect if currently on a guest page or if there was a redirect query
          if (router.currentRoute.value.meta.guestOnly || router.currentRoute.value.query.redirect) {
            router.push(redirectPath);
          }
        } else if (event === 'USER_UPDATED') {
            if (newSession?.user) {
                this.user = { ...this.user, ...newSession.user };
            }
        }
      });

      if (!this.session && !this.loading) {
          this.loading = true;
          try {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                this.session = data.session;
                this.user = data.session.user;
                localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.session));
            } else {
                this._clearAuthState();
            }
          } catch (error) {
            console.error('Error getting initial session explicitly:', error);
            this.error = { message: error.message || 'Failed to get initial session.' };
            this._clearAuthState();
          } finally {
            this.loading = false;
          }
      } else if (this.session && !this.user && this.session.user) {
          this.user = this.session.user;
      }
    },

    async login(credentials) {
      this.loading = true;
      this.error = null;
      const notificationsStore = useNotificationsStore();
      try {
        const { data, error: supaError } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });
        if (supaError) throw supaError;
        notificationsStore.showSuccess('Login successful!');
        // onAuthStateChange will handle state update and navigation if on login page
        return data;
      } catch (error) {
        console.error('Login error:', error);
        const errorMessage = error.message || 'Login failed. Please check your credentials.';
        this.error = { message: errorMessage, status: error.status };
        notificationsStore.showError(errorMessage);
        this._clearAuthState();
        throw this.error;
      } finally {
        this.loading = false;
      }
    },

    async signup(credentials) {
      this.loading = true;
      this.error = null;
      const notificationsStore = useNotificationsStore();
      try {
        const { data, error: supaError } = await supabase.auth.signUp({
          email: credentials.email,
          password: credentials.password,
        });

        if (supaError) {
          if (supaError.message.includes("User already registered")) {
             this.error = { message: "This email is already registered. Try logging in or use a different email.", status: supaError.status, userExists: true };
          } else {
            throw supaError;
          }
        }

        if (data.session) {
          notificationsStore.showSuccess('Signup successful and logged in!');
        } else if (data.user) {
          const confirmMsg = 'Signup successful! Please check your email to confirm your account.';
          this.error = { message: confirmMsg, isConfirmationPending: true };
          notificationsStore.showInfo(confirmMsg, { timeout: 0 });
        } else if (this.error) {
            notificationsStore.showError(this.error.message);
        } else {
             notificationsStore.showWarning('Signup process completed with an unexpected response.');
        }
        return data;
      } catch (error) {
        console.error('Signup error:', error);
        const errorMessage = error.message || 'Signup failed. Please try again.';
        this.error = { message: errorMessage, status: error.status };
        notificationsStore.showError(errorMessage);
        this._clearAuthState();
        throw this.error;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      this.loading = true;
      this.error = null;
      const notificationsStore = useNotificationsStore();
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        notificationsStore.showInfo('You have been logged out.');
      } catch (error) {
        console.error('Logout error:', error);
        const errorMessage = error.message || 'Logout failed.';
        this.error = { message: errorMessage, status: error.status };
        notificationsStore.showError(errorMessage);
        this._clearAuthState();
        router.push('/login');
        throw this.error;
      } finally {
        this.loading = false;
      }
    },

    async updateUserProfile(profileData) {
      this.loading = true;
      this.error = null;
      const notificationsStore = useNotificationsStore();
      try {
        // Supabase stores this in user_metadata. Ensure keys in profileData are simple.
        const { data, error: supaError } = await supabase.auth.updateUser({
          data: profileData
        });
        if (supaError) throw supaError;
        // onAuthStateChange with 'USER_UPDATED' event will update the store's user object.
        notificationsStore.showSuccess('Profile updated successfully!');
        return data.user;
      } catch (error) {
        console.error('Update user profile error:', error);
        const errorMessage = error.message || 'Failed to update profile.';
        this.error = { message: errorMessage, status: error.status };
        notificationsStore.showError(errorMessage);
        throw this.error;
      } finally {
        this.loading = false;
      }
    },

    async changePassword(newPassword) {
      this.loading = true;
      this.error = null;
      const notificationsStore = useNotificationsStore();
      try {
        const { data, error: supaError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (supaError) throw supaError;

        notificationsStore.showSuccess('Password updated successfully! You might need to log in again if your session was invalidated.');
        return data.user;
      } catch (error) {
        console.error('Change password error:', error);
        let errorMessage = error.message || 'Failed to change password.';
        if (error.message && error.message.toLowerCase().includes("weak password")) {
            errorMessage = "New password is too weak. Please choose a stronger password.";
        }
        this.error = { message: errorMessage, status: error.status };
        notificationsStore.showError(errorMessage);
        throw this.error;
      } finally {
        this.loading = false;
      }
    },

    async fetchCurrentSession() {
      if (this.session && this.user && !this.loading) return { session: this.session, user: this.user };
      this.loading = true;
      this.error = null;
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data.session) {
          this.session = data.session;
          this.user = data.session.user;
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.session));
        } else {
          this._clearAuthState();
        }
        return data;
      } catch (error) {
        console.error('Fetch session error:', error);
        this.error = { message: error.message || 'Failed to fetch session.', status: error.status };
        this._clearAuthState();
        return null;
      } finally {
        this.loading = false;
      }
    },

    clearError() {
      this.error = null;
    }
  },
});
