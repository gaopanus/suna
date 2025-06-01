import { defineStore } from 'pinia';
import { supabase } from '@/services/supabaseClient';
import router from '@/router'; // Import router for navigation
import { useNotificationsStore } from './notifications'; // For global notifications

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
  },
  actions: {
    _clearAuthState() {
      this.user = null;
      this.session = null;
      localStorage.removeItem(SESSION_STORAGE_KEY);
    },

    async initializeAuthListener() {
      // Initial state from localStorage
      if (this.session?.user) {
        this.user = this.session.user;
      } else if (this.session) { // Session exists but no user? Could be an old/invalid session.
        this._clearAuthState(); // Clear it.
      }

      supabase.auth.onAuthStateChange((event, newSession) => {
        console.log('Auth state changed:', event, newSession);
        this.session = newSession;
        this.user = newSession?.user || null;
        this.loading = false;
        this.error = null; // Clear error on any auth state change

        if (newSession) {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
        } else {
          this._clearAuthState(); // Ensures everything is cleared on SIGNED_OUT
        }

        if (event === 'SIGNED_OUT') {
          // Clear other stores if needed, then navigate
          // e.g., useProjectStore().clearAllProjectData(); useCurrentThreadStore().resetState();
          if (router.currentRoute.value.meta.requiresAuth) {
            router.push({ name: 'Login', query: { loggedOut: 'true' } });
          }
        } else if (event === 'SIGNED_IN') {
          const redirectPath = router.currentRoute.value.query.redirect || '/';
          if (router.currentRoute.value.name === 'Login' || router.currentRoute.value.name === 'Signup' || redirectPath) {
            router.push(redirectPath);
          }
        }
      });

      // Explicitly fetch session if not already loaded and no listener event has fired yet
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
          // If session was loaded from localStorage but user object wasn't fully hydrated in state
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

        // onAuthStateChange will handle setting user and session state & localStorage
        notificationsStore.showSuccess('Login successful!');
        return data;
      } catch (error) {
        console.error('Login error:', error);
        const errorMessage = error.message || 'Login failed. Please check your credentials.';
        this.error = { message: errorMessage, status: error.status };
        notificationsStore.showError(errorMessage);
        this._clearAuthState(); // Ensure inconsistent state is cleared
        throw this.error; // Re-throw for component to handle if needed
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

        // onAuthStateChange will set user/session if auto-confirm is on.
        // If email confirmation is required, data.user will exist but data.session will be null.
        if (data.session) {
          notificationsStore.showSuccess('Signup successful and logged in!');
        } else if (data.user) {
          const confirmMsg = 'Signup successful! Please check your email to confirm your account.';
          this.error = { message: confirmMsg, isConfirmationPending: true }; // Use error state to show info
          notificationsStore.showInfo(confirmMsg, { timeout: 0 }); // Persistent info
        } else if (this.error) { // User already registered error was set
            notificationsStore.showError(this.error.message);
        } else {
            // Should not happen if no error and no user/session
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
      this.loading = true; // Optional: show loading during logout
      this.error = null;
      const notificationsStore = useNotificationsStore();
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        // State clearing (user, session, localStorage) is handled by onAuthStateChange's 'SIGNED_OUT' event.
        // Explicitly clear project/thread stores here if they contain user-specific data
        // Example: useProjectStore().clearUserProjectData();
        //          useCurrentThreadStore().resetCurrentThreadState();
        notificationsStore.showInfo('You have been logged out.');
      } catch (error) {
        console.error('Logout error:', error);
        const errorMessage = error.message || 'Logout failed.';
        this.error = { message: errorMessage, status: error.status };
        notificationsStore.showError(errorMessage);
        // Even on error, try to clear local state as a fallback
        this._clearAuthState();
        router.push('/login'); // Force redirect if listener fails
        throw this.error;
      } finally {
        this.loading = false;
      }
    },

    async fetchCurrentSession() { // Renamed from fetchUser for clarity
      // This is mostly for initial load or manual refresh, onAuthStateChange is primary
      if (this.session && this.user && !this.loading) return { session: this.session, user: this.user };

      this.loading = true;
      this.error = null; // Clear previous error before fetching
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
        this._clearAuthState(); // Critical to ensure no stale state
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
