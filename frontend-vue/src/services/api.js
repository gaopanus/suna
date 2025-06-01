import { supabase } from './supabaseClient';
import apiClient from './apiClient';
import { useAuthStore } from '@/store/auth';
import pinia from '@/store';

function getCurrentUserId() {
  const auth = useAuthStore(pinia);
  if (!auth.user) { return null; }
  return auth.user.id;
}

export function handleApiError(error, context = {}) {
  const operation = context.operation || 'API operation';
  const resource = context.resource || 'resource';
  let errorMessage = `Failed to ${operation}`;
  if (resource) { errorMessage += ` for ${resource}`; }

  let errorDetail = {
    message: 'An unknown error occurred.',
    code: error.code || 'UNKNOWN_ERROR',
    status: error.response?.status || error.status || null,
    details: error.details || error.response?.data?.detail || null,
  };

  if (error && error.message) { errorDetail.message = error.message; }
  if (error.response?.data?.detail) {
    errorDetail.message = typeof error.response.data.detail === 'string'
        ? error.response.data.detail
        : JSON.stringify(error.response.data.detail);
  }
  console.error(`${errorMessage}:`, errorDetail.message, 'Code:', errorDetail.code, 'Status:', errorDetail.status, 'Details:', errorDetail.details || error);
  return errorDetail;
}

// --- Project Management Functions ---
export async function getProjects() {
  const userId = getCurrentUserId();
  if (!userId) { console.log('getProjects: No user logged in, returning empty array.'); return []; }
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
  if (!userId && !projectId.startsWith('public_')) { console.log('getProject: No user logged in for a private project.'); return null; }
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
  if (!userId) { handleApiError(new Error('User must be logged in to create a project.'), { operation: 'create project' }); return null; }
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
  if (!userId) { handleApiError(new Error('User must be logged in to update a project.'), { operation: 'update project' }); return null; }
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
  if (!userId) { handleApiError(new Error('User must be logged in to delete a project.'), { operation: 'delete project' }); return false; }
  try {
    const { error } = await supabase.from('projects').delete().eq('project_id', projectId).eq('account_id', userId);
    if (error) throw error;
    return true;
  } catch (error) {
    handleApiError(error, { operation: 'delete project', resource: `project ${projectId}` });
    return false;
  }
}

// --- Thread Management Functions ---
export async function getThreads(projectId) {
  const userId = getCurrentUserId();
  if (!userId) { console.log('getThreads: No user logged in, returning empty array.'); return []; }
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
  if (!userId && !threadId.startsWith('public_')) { console.log('getThread: No user logged in for a private thread.'); return null; }
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
  if (!userId) { handleApiError(new Error('User must be logged in to create a thread.'), { operation: 'create thread' }); return null; }
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
  if (!userId) { handleApiError(new Error('User must be logged in to update a thread.'), { operation: 'update thread' }); return null; }
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
  if (!userId) { handleApiError(new Error('User must be logged in to delete a thread.'), { operation: 'delete thread' }); return false; }
  try {
    const { error } = await supabase.from('threads').delete().eq('thread_id', threadId).eq('account_id', userId);
    if (error) throw error;
    return true;
  } catch (error) {
    handleApiError(error, { operation: 'delete thread', resource: `thread ${threadId}` });
    return false;
  }
}

// --- Message Management Functions ---
export async function addUserMessage(threadId, textContent) {
  const userId = getCurrentUserId();
  if (!userId) { handleApiError(new Error('User must be logged in to add a message.'), { operation: 'add message' }); return null; }
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
  if (!userId && !threadId.startsWith('public_')) { console.log('getMessages: No user logged in for a private thread.'); return []; }
  try {
    const { data, error } = await supabase.from('messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(msg => ({ ...msg, content: typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content, metadata: msg.metadata && typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata, }));
  } catch (error) {
    handleApiError(error, { operation: 'load messages', resource: `thread ${threadId}` });
    return [];
  }
}

// --- Agent Management Functions ---
export async function getMarketplaceAgents(params = {}) {
  try { const response = await apiClient.get('/marketplace/agents', { params }); return response.data; }
  catch (error) { throw handleApiError(error, { operation: 'load marketplace agents' }); }
}
export async function getAgentDetails(agentId) {
  try { const response = await apiClient.get(`/agents/${agentId}`); return response.data; }
  catch (error) { throw handleApiError(error, { operation: 'load agent details', resource: `agent ${agentId}` }); }
}
export async function addAgentToLibrary(agentId) {
  try { const response = await apiClient.post(`/marketplace/agents/${agentId}/add-to-library`); return response.data; }
  catch (error) { throw handleApiError(error, { operation: 'add agent to library', resource: `agent ${agentId}` }); }
}
export async function getUserAgents() {
  try { const response = await apiClient.get('/agents'); return response.data; }
  catch (error) { throw handleApiError(error, { operation: 'load user agents' }); }
}
export async function createAgent(agentData) {
  try { const response = await apiClient.post('/agents', agentData); return response.data; }
  catch (error) { throw handleApiError(error, { operation: 'create agent' }); }
}
export async function updateAgent(agentId, agentData) {
  try { const response = await apiClient.put(`/agents/${agentId}`, agentData); return response.data; }
  catch (error) { throw handleApiError(error, { operation: 'update agent', resource: `agent ${agentId}` }); }
}
export async function deleteAgent(agentId) {
  try { const response = await apiClient.delete(`/agents/${agentId}`); return response.data; }
  catch (error) { throw handleApiError(error, { operation: 'delete agent', resource: `agent ${agentId}` }); }
}

// --- Agent Run Functions ---
export async function startAgentRun(threadId, options = {}) {
    try { const response = await apiClient.post(`/thread/${threadId}/agent/start`, options); return response.data; }
    catch (error) { throw handleApiError(error, { operation: 'start agent run', resource: `thread ${threadId}` }); }
}
export async function stopAgentRun(agentRunId) {
    try { const response = await apiClient.post(`/agent-run/${agentRunId}/stop`); return response.data; }
    catch (error) { throw handleApiError(error, { operation: 'stop agent run', resource: `agent run ${agentRunId}` }); }
}

// --- Billing Functions ---
/**
 * Fetches the current subscription details for the user.
 * @returns {Promise<object|null>} Subscription object or null on error.
 */
export async function getSubscriptionDetails() {
    try {
        const response = await apiClient.get('/billing/subscription');
        return response.data;
    } catch (error) {
        // handleApiError will log it. The store action will handle user notification.
        throw handleApiError(error, { operation: 'fetch subscription details' });
    }
}

/**
 * Fetches a list of invoices for the user.
 * @param {object} [params] - Optional parameters like limit, starting_after for pagination.
 * @returns {Promise<Array<object>>} Array of invoice objects or empty array on error.
 */
export async function listInvoices(params = {}) {
    try {
        const response = await apiClient.get('/billing/invoices', { params });
        return response.data.invoices || []; // Assuming backend returns { invoices: [] }
    } catch (error) {
        throw handleApiError(error, { operation: 'list invoices' });
    }
}

/**
 * Creates a new Stripe Customer Portal session for the user.
 * @returns {Promise<{url: string}|null>} Object with URL to redirect to, or null on error.
 */
export async function createBillingPortalSession() {
    try {
        // The backend might need the current page URL to redirect back after portal session.
        const response = await apiClient.post('/billing/create-portal-session', {
            return_url: window.location.href // Or a specific settings/billing page URL
        });
        return response.data; // Expected: { url: 'stripe_portal_url' }
    } catch (error) {
        throw handleApiError(error, { operation: 'create billing portal session' });
    }
}

/**
 * Fetches current usage details for the user's subscription.
 * @returns {Promise<object|null>} Usage details object or null on error.
 */
export async function getUsageDetails() {
    try {
        const response = await apiClient.get('/billing/usage'); // Replace with your actual usage endpoint
        return response.data; // E.g., { agentRuns: { used: 50, limit: 100 }, ... }
    } catch (error) {
        throw handleApiError(error, { operation: 'fetch usage details' });
    }
}


// --- Health Check ---
export async function checkApiHealth() {
  try { const response = await apiClient.get(`/health`); return response.data; }
  catch (error) {
     handleApiError(error, { operation: 'check API health' });
     return { status: 'error', message: error.message || 'Failed to connect to API' };
  }
}
