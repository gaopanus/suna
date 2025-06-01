import { useAuthStore } from '@/store/auth';
import pinia from '@/store';

// It's important that Pinia is initialized before this module is imported heavily,
// or that the store is accessed lazily if this module is imported early.
// For simplicity here, we assume Pinia is available.

/**
 * Establishes an SSE connection to stream agent responses.
 * @param {string} runId - The ID of the agent run to stream.
 * @param {function} onOpenCallback - Called when the connection is opened.
 * @param {function} onMessageCallback - Called for each message received.
 * @param {function} onErrorCallback - Called when an error occurs.
 * @returns {EventSource | null} The EventSource instance, or null if token is unavailable.
 */
export function streamAgentResponse(runId, onOpenCallback, onMessageCallback, onErrorCallback) {
  const authStore = useAuthStore(pinia);
  const token = authStore.session?.access_token;

  if (!token) {
    console.error('SSE Service: No access token available for streaming.');
    onErrorCallback(new Error('Authentication token not found. Cannot connect to stream.'));
    return null;
  }

  // Construct the URL for the SSE endpoint.
  // The backend must support passing the token via a query parameter if headers are not an option.
  // Example: /api/agent-run/{agent_run_id}/stream?token={jwt_token}
  // Using VITE_API_BASE_URL which should point to your backend's base, e.g., http://localhost:8000/api
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, ''); // Remove trailing slash if any
  const streamUrl = `${baseUrl}/agent-run/${runId}/stream?token=${encodeURIComponent(token)}`;

  console.log(`SSE Service: Connecting to stream URL: ${streamUrl}`);

  const eventSource = new EventSource(streamUrl); // `withCredentials` is not needed if token is in URL

  eventSource.onopen = (event) => {
    console.log('SSE Service: Connection opened.', event);
    if (onOpenCallback) {
      onOpenCallback(event);
    }
  };

  eventSource.onmessage = (event) => {
    // console.log('SSE Service: Message received - raw data:', event.data);
    if (event.data) {
      try {
        const parsedData = JSON.parse(event.data);
        if (onMessageCallback) {
          onMessageCallback(parsedData);
        }
      } catch (e) {
        console.error('SSE Service: Error parsing message data JSON:', e, 'Raw data:', event.data);
        // Optionally call onErrorCallback or a specific onParseErrorCallback
        // For now, we'll let it fail silently or be handled by a general error message in the UI
      }
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE Service: EventSource error.', error);
    if (onErrorCallback) {
      onErrorCallback(error); // error is an Event object, not Error instance usually.
    }
    // EventSource will attempt to reconnect automatically on some errors.
    // If it's a fatal error (e.g., 401, 403 from server), it might stop retrying.
    // The `onErrorCallback` in the store should handle closing the ES if necessary.
  };

  return eventSource;
}
