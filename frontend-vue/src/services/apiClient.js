import axios from 'axios';
import { useAuthStore } from '@/store/auth'; // Import Pinia auth store
import pinia from '@/store'; // Import the Pinia instance

// Use the auth store outside of a component context by passing the pinia instance
// This is necessary because the interceptor is set up when this module is imported,
// which might be before Vue components are initialized.
const authStore = useAuthStore(pinia);

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // Default to /api if not set
  // timeout: 10000, // Optional: Timeout after 10 seconds
  // withCredentials: true, // Uncomment if backend uses cookies for sessions (not typical for Supabase JWT)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  async (config) => {
    // Attempt to get the current session and token from the auth store
    // This ensures we use the most up-to-date token.
    // If the session is not immediately available, and a request is made,
    // it might be necessary to await session refresh or use a persisted token.

    // Ensure store's session is loaded, especially if it's the first request after page load
    if (!authStore.session && localStorage.getItem('supabase_session')) {
        // This is a fallback to ensure session is loaded if interceptor runs before store fully initializes from async listener
        // console.log('API Client Interceptor: Manually fetching session for token.');
        // await authStore.fetchCurrentSession(); // This might introduce delay if not handled carefully
    }

    const token = authStore.session?.access_token;

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      // console.log('API Client Interceptor: Token added to request headers.');
    } else {
      // console.log('API Client Interceptor: No token found in auth store session.');
      // Handle cases where token is not available, e.g., public endpoints
      // Or if a request is made before login, it will proceed without Authorization header.
    }
    return config;
  },
  (error) => {
    console.error('API Client Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    console.error('API Client Response Error:', error.response || error.message || error);

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      if (status === 401) {
        // Handle unauthorized errors (e.g., token expired)
        // authStore.logout(); // Example: force logout
        // router.push('/login'); // Example: redirect to login
        console.error('API Error: Unauthorized (401). Token might be invalid or expired.');
        // Consider calling authStore.logout() or refreshing token here
      } else if (status === 403) {
        console.error('API Error: Forbidden (403). User does not have permission.');
      } else if (status === 404) {
        console.error('API Error: Not Found (404). Endpoint or resource missing.');
      } else {
        console.error(`API Error: ${status}`, data?.message || data);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error: No response received from server.', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error: Error in request setup.', error.message);
    }

    // It's good practice to return a rejected promise with a structured error
    return Promise.reject(error.response?.data || { message: error.message, code: error.code });
  }
);

export default apiClient;

// VITE_API_BASE_URL should be set in your .env file. For example:
// VITE_API_BASE_URL=http://localhost:8000/api
// If your FastAPI backend is running on port 8000 and endpoints are under /api
// If you are using Vite's proxy, this might just be '/api'.
// Example Vite proxy config in vite.config.js:
// server: {
//   proxy: {
//     '/api': {
//       target: 'http://localhost:8000', // Your backend server
//       changeOrigin: true,
//       rewrite: (path) => path.replace(/^\/api/, ''), // if backend doesn't have /api prefix
//     },
//   },
// },
// In this case, VITE_API_BASE_URL would be '/api'. If backend already has /api, then no rewrite needed.
// For now, the default is '/api' which assumes Vite's dev server is proxying requests.
// For production, ensure this VITE_API_BASE_URL points to your deployed backend API.
