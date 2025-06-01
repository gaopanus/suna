import { supabase } from './supabaseClient'; // Using the Supabase client for direct DB interactions
import apiClient from './apiClient'; // Axios client for other backend interactions (agent, sandbox, etc.)
// We will also need the auth store to get user ID for filtering, etc.
import { useAuthStore } from '@/store/auth';
import pinia from '@/store';

// Helper to get current user ID from auth store
function getCurrentUserId() {
  const auth = useAuthStore(pinia); // Access store outside component setup
  if (!auth.user) {
    // console.warn('User not authenticated. Cannot perform user-specific API call.');
    // throw new Error('User not authenticated.'); // Or handle as per app's requirements
    return null;
  }
  return auth.user.id;
}

/**
 * @typedef {Object} ApiErrorDetail
 * @property {string} message
 * @property {string} [code]
 * @property {any} [details]
 * @property {number} [status]
 */

/**
 * Handles API errors, logs them, and can be extended for user notifications.
 * @param {Error | any} error - The error object from the API call.
 * @param {object} [context={}] - Additional context for the error.
 * @param {string} [context.operation] - The operation that failed (e.g., 'load projects').
 * @param {string} [context.resource] - The resource being accessed.
 * @returns {ApiErrorDetail} A structured error detail.
 */
export function handleApiError(error, context = {}) {
  const operation = context.operation || 'API operation';
  const resource = context.resource || 'resource';
  let errorMessage = `Failed to ${operation}`;
  if (resource) {
    errorMessage += ` for ${resource}`;
  }

  let errorDetail = {
    message: 'An unknown error occurred.',
    code: error.code || 'UNKNOWN_ERROR',
    status: error.response?.status || error.status || null,
    details: error.details || error.response?.data?.detail || null,
  };

  if (error && error.message) {
    errorDetail.message = error.message;
  }

  // If it's an Axios error, the actual error message from backend might be in error.response.data.detail
  if (error.response?.data?.detail) {
    errorDetail.message = typeof error.response.data.detail === 'string'
        ? error.response.data.detail
        : JSON.stringify(error.response.data.detail);
  }


  console.error(`${errorMessage}:`, errorDetail.message, 'Code:', errorDetail.code, 'Status:', errorDetail.status, 'Details:', errorDetail.details || error);
  return errorDetail;
}


// --- Project Management Functions (using Supabase client)---
// ... (previous project functions remain here) ...
/**
 * @typedef {Object} Project
 * @property {string} id - Project ID (maps to project_id in DB)
 * @property {string} name
 * @property {string | null} description
 * @property {string} account_id - User ID of the owner
 * @property {string} created_at
 * @property {string | null} updated_at
 * @property {object | null} sandbox - Sandbox details
 */
export async function getProjects() {
  const userId = getCurrentUserId();
  if (!userId) {
    console.log('getProjects: No user logged in, returning empty array.');
    return [];
  }
  try {
    const { data, error } = await supabase.from('projects').select('*').eq('account_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(project => ({ id: project.project_id, ...project, }));
  } catch (error) {
    handleApiError(error, { operation: 'load projects', resource: 'projects' });
    return [];
  }
}
export async function getProject(projectId) {
  const userId = getCurrentUserId();
  if (!userId && !projectId.startsWith('public_')) {
     console.log('getProject: No user logged in for a private project.');
     return null;
  }
  try {
    let query = supabase.from('projects').select('*').eq('project_id', projectId);
    const { data, error } = await query.single();
    if (error) {
      if (error.code === 'PGRST116') {
        handleApiError(new Error(`Project with ID ${projectId} not found or not accessible.`), { operation: 'load project', resource: `project ${projectId}` });
        return null;
      }
      throw error;
    }
    return data ? { id: data.project_id, ...data } : null;
  } catch (error) {
    handleApiError(error, { operation: 'load project', resource: `project ${projectId}` });
    return null;
  }
}
export async function createProject(projectData) {
  const userId = getCurrentUserId();
  if (!userId) {
    handleApiError(new Error('User must be logged in to create a project.'), { operation: 'create project' });
    return null;
  }
  try {
    const { data, error } = await supabase.from('projects').insert({ name: projectData.name, description: projectData.description || null, account_id: userId, }).select().single();
    if (error) throw error;
    return data ? { id: data.project_id, ...data } : null;
  } catch (error) {
    handleApiError(error, { operation: 'create project', resource: 'project' });
    return null;
  }
}
export async function updateProject(projectId, updateData) {
  const userId = getCurrentUserId();
  if (!userId) {
     handleApiError(new Error('User must be logged in to update a project.'), { operation: 'update project' });
    return null;
  }
  const { id, project_id, account_id, created_at, ...validUpdateData } = updateData;
  try {
    const { data, error } = await supabase.from('projects').update(validUpdateData).eq('project_id', projectId).eq('account_id', userId).select().single();
    if (error) throw error;
    return data ? { id: data.project_id, ...data } : null;
  } catch (error) {
    handleApiError(error, { operation: 'update project', resource: `project ${projectId}` });
    return null;
  }
}
export async function deleteProject(projectId) {
  const userId = getCurrentUserId();
   if (!userId) {
    handleApiError(new Error('User must be logged in to delete a project.'), { operation: 'delete project' });
    return false;
  }
  try {
    const { error } = await supabase.from('projects').delete().eq('project_id', projectId).eq('account_id', userId);
    if (error) throw error;
    return true;
  } catch (error) {
    handleApiError(error, { operation: 'delete project', resource: `project ${projectId}` });
    return false;
  }
}

// --- Thread Management Functions (using Supabase client) ---
// ... (previous thread functions remain here) ...
/**
 * @typedef {Object} Thread
 * @property {string} thread_id
 * @property {string | null} project_id
 * @property {string} account_id
 * @property {boolean} is_public
 * @property {string} created_at
 * @property {string | null} updated_at
 */
export async function getThreads(projectId) {
  const userId = getCurrentUserId();
  if (!userId) {
    console.log('getThreads: No user logged in, returning empty array.');
    return [];
  }
  try {
    let query = supabase.from('threads').select('*').eq('account_id', userId).order('created_at', { ascending: false });
    if (projectId) { query = query.eq('project_id', projectId); }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    handleApiError(error, { operation: 'load threads', resource: projectId ? `threads for project ${projectId}` : 'all threads' });
    return [];
  }
}
export async function getThread(threadId) {
  const userId = getCurrentUserId();
   if (!userId && !threadId.startsWith('public_')) {
     console.log('getThread: No user logged in for a private thread.');
     return null;
  }
  try {
    const { data, error } = await supabase.from('threads').select('*').eq('thread_id', threadId).single();
    if (error) {
       if (error.code === 'PGRST116') {
        handleApiError(new Error(`Thread with ID ${threadId} not found or not accessible.`), { operation: 'load thread', resource: `thread ${threadId}` });
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    handleApiError(error, { operation: 'load thread', resource: `thread ${threadId}` });
    return null;
  }
}
export async function createThread(threadData = {}) {
  const userId = getCurrentUserId();
  if (!userId) {
    handleApiError(new Error('User must be logged in to create a thread.'), { operation: 'create thread' });
    return null;
  }
  try {
    const { data, error } = await supabase.from('threads').insert({ project_id: threadData.project_id || null, account_id: userId, }).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error, { operation: 'create thread', resource: 'thread' });
    return null;
  }
}
export async function updateThread(threadId, updateData) {
  const userId = getCurrentUserId();
  if (!userId) {
    handleApiError(new Error('User must be logged in to update a thread.'), { operation: 'update thread' });
    return null;
  }
  const { thread_id, account_id, created_at, ...validUpdateData } = updateData;
  try {
    const { data, error } = await supabase.from('threads').update(validUpdateData).eq('thread_id', threadId).eq('account_id', userId).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error, { operation: 'update thread', resource: `thread ${threadId}` });
    return null;
  }
}
export async function deleteThread(threadId) {
  const userId = getCurrentUserId();
  if (!userId) {
    handleApiError(new Error('User must be logged in to delete a thread.'), { operation: 'delete thread' });
    return false;
  }
  try {
    const { error } = await supabase.from('threads').delete().eq('thread_id', threadId).eq('account_id', userId);
    if (error) throw error;
    return true;
  } catch (error) {
    handleApiError(error, { operation: 'delete thread', resource: `thread ${threadId}` });
    return false;
  }
}

// --- Message Management Functions (Example - using Supabase client) ---
// ... (previous message functions remain here) ...
/**
 * @typedef {Object} MessagePayload
 * @property {string} role - e.g., 'user', 'assistant'
 * @property {string} content - The actual message content
 */
/** @typedef {Object} Message ... */
export async function addUserMessage(threadId, textContent) {
  const userId = getCurrentUserId();
  if (!userId) {
    handleApiError(new Error('User must be logged in to add a message.'), { operation: 'add message' });
    return null;
  }
  try {
    const messagePayload = { role: 'user', content: textContent, };
    const { data, error } = await supabase.from('messages').insert({ thread_id: threadId, type: 'user', is_llm_message: true, content: JSON.stringify(messagePayload), }).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error, { operation: 'add user message', resource: `thread ${threadId}` });
    return null;
  }
}
export async function getMessages(threadId) {
  const userId = getCurrentUserId();
  if (!userId && !threadId.startsWith('public_')) {
     console.log('getMessages: No user logged in for a private thread.');
    return [];
  }
  try {
    const { data, error } = await supabase.from('messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(msg => ({ ...msg, content: typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content, metadata: msg.metadata && typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata, }));
  } catch (error) {
    handleApiError(error, { operation: 'load messages', resource: `thread ${threadId}` });
    return [];
  }
}


// --- Agent Management Functions (using apiClient for custom FastAPI backend) ---

/**
 * @typedef {Object} Agent
 * @property {string} agent_id
 * @property {string} name
 * @property {string|null} description
 * @property {string} system_prompt
 * @property {Array<Object>|null} configured_mcps
 * @property {Object|null} agentpress_tools
 * @property {boolean} is_default
 * @property {boolean} is_public
 * @property {string|null} marketplace_published_at
 * @property {number} download_count
 * @property {Array<string>|null} tags
 * @property {string|null} avatar
 * @property {string|null} avatar_color
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string|null} creator_name - For marketplace agents
 */

/**
 * Fetches public agents from the marketplace.
 * @param {Object} [params] - Optional query parameters (search, tags, limit, offset)
 * @returns {Promise<{agents: Agent[]}>}
 */
export async function getMarketplaceAgents(params = {}) {
  try {
    const response = await apiClient.get('/marketplace/agents', { params });
    return response.data; // Expected: { agents: Agent[] }
  } catch (error) {
    throw handleApiError(error, { operation: 'load marketplace agents' });
  }
}

/**
 * Fetches details for a specific agent.
 * @param {string} agentId
 * @returns {Promise<Agent>}
 */
export async function getAgentDetails(agentId) {
  try {
    const response = await apiClient.get(`/agents/${agentId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, { operation: 'load agent details', resource: `agent ${agentId}` });
  }
}

/**
 * Adds a marketplace agent to the user's library.
 * @param {string} agentId - The ID of the marketplace agent.
 * @returns {Promise<{message: string, new_agent_id: string}>}
 */
export async function addAgentToLibrary(agentId) {
  try {
    const response = await apiClient.post(`/marketplace/agents/${agentId}/add-to-library`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, { operation: 'add agent to library', resource: `agent ${agentId}` });
  }
}

// Note: removeAgentFromLibrary might not be a direct "remove from library" if it's a copy.
// It might be equivalent to deleting a user's own agent.
// If it's a distinct operation, the endpoint needs to be defined.
// For now, assuming it's similar to deleteUserAgent.

/**
 * Fetches agents belonging to the current user.
 * @returns {Promise<Agent[]>}
 */
export async function getUserAgents() {
  try {
    const response = await apiClient.get('/agents'); // Endpoint for user's own agents
    return response.data; // Expected: Agent[]
  } catch (error) {
    throw handleApiError(error, { operation: 'load user agents' });
  }
}

/**
 * @typedef {Object} AgentCreationData
 * @property {string} name
 * @property {string|null} [description]
 * @property {string} system_prompt
 * @property {Array<Object>|null} [configured_mcps]
 * @property {Object|null} [agentpress_tools]
 * @property {boolean|null} [is_default]
 * @property {string|null} [avatar]
 * @property {string|null} [avatar_color]
 */

/**
 * Creates a new agent for the user.
 * @param {AgentCreationData} agentData
 * @returns {Promise<Agent>}
 */
export async function createAgent(agentData) {
  try {
    const response = await apiClient.post('/agents', agentData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, { operation: 'create agent' });
  }
}

/**
 * Updates an existing agent.
 * @param {string} agentId
 * @param {Partial<AgentCreationData>} agentData
 * @returns {Promise<Agent>}
 */
export async function updateAgent(agentId, agentData) {
  try {
    const response = await apiClient.put(`/agents/${agentId}`, agentData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, { operation: 'update agent', resource: `agent ${agentId}` });
  }
}

/**
 * Deletes an agent owned by the user.
 * @param {string} agentId
 * @returns {Promise<{message: string}>}
 */
export async function deleteAgent(agentId) {
  try {
    const response = await apiClient.delete(`/agents/${agentId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, { operation: 'delete agent', resource: `agent ${agentId}` });
  }
}


// Health check (uses apiClient without specific auth for this endpoint if public)
export async function checkApiHealth() {
  try {
    const response = await apiClient.get(`/health`);
    return response.data;
  } catch (error) {
     handleApiError(error, { operation: 'check API health' });
     return { status: 'error', message: error.message || 'Failed to connect to API' };
  }
}

// Agent run related APIs (will use apiClient) - to be used by currentThreadStore later
/**
 * Starts an agent run for a given thread.
 * @param {string} threadId
 * @param {object} [options] - Optional parameters like model_name, agent_id
 * @returns {Promise<{agent_run_id: string}>}
 */
export async function startAgentRun(threadId, options = {}) {
    try {
        const response = await apiClient.post(`/thread/${threadId}/agent/start`, options);
        return response.data; // Expected: { agent_run_id: '...' }
    } catch (error) {
        throw handleApiError(error, { operation: 'start agent run', resource: `thread ${threadId}` });
    }
}

/**
 * Stops an active agent run.
 * @param {string} agentRunId
 * @returns {Promise<{status: string}>}
 */
export async function stopAgentRun(agentRunId) {
    try {
        const response = await apiClient.post(`/agent-run/${agentRunId}/stop`);
        return response.data; // Expected: { status: 'stopped' }
    } catch (error) {
        throw handleApiError(error, { operation: 'stop agent run', resource: `agent run ${agentRunId}` });
    }
}

// ... other API functions (sandbox, billing, transcription) would go here, using apiClient.
// Example:
// export async function transcribeAudio(audioFile) {
//   const formData = new FormData();
//   formData.append('audio_file', audioFile);
//   try {
//     const response = await apiClient.post('/transcription', formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//     return response.data;
//   } catch (error) {
//     throw handleApiError(error, { operation: 'transcribe audio' });
//   }
// }
