import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { getMessages, addUserMessage as apiAddUserMessage, startAgentRun as apiStartAgentRun } from '@/services/api'; // Assuming api.js exports these
import { streamAgentResponse } from '@/services/sseService';
import { useNotificationsStore } from './notifications';

export const useCurrentThreadStore = defineStore('currentThread', {
  state: () => ({
    threadId: null,
    messages: [],
    isLoadingMessages: false,
    isSendingMessage: false, // Specifically for the user's message sending part

    agentRunId: null,
    agentRunStatus: 'idle', // 'idle', 'starting', 'connecting', 'streaming', 'thinking', 'tool_started', 'tool_output_pending', 'completed', 'error', 'stopped'
    currentToolCall: null,
    streamError: null, // { message: string, event?: any, details?: any }

    eventSourceInstance: null,
    currentAssistantMessage: '',
    currentAssistantMessageId: null,
  }),

  getters: {
    sortedMessages: (state) => {
      return [...state.messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    },
    hasActiveAgentRun: (state) => ['starting', 'connecting', 'streaming', 'thinking', 'tool_started', 'tool_output_pending'].includes(state.agentRunStatus),
    isStreamingOutput: (state) => state.agentRunStatus === 'streaming' || state.agentRunStatus === 'thinking', // For UI to show general activity
  },

  actions: {
    resetCurrentThreadState() {
      this.stopAgentStream(); // Important to close any active SSE connection
      this.threadId = null;
      this.messages = [];
      this.isLoadingMessages = false;
      this.isSendingMessage = false;
      this.agentRunId = null;
      this.agentRunStatus = 'idle';
      this.currentToolCall = null;
      this.streamError = null;
      this.currentAssistantMessage = '';
      this.currentAssistantMessageId = null;
      console.log('CurrentThreadStore: State has been reset.');
    },

    async initializeThread(newThreadId) {
        if (this.threadId === newThreadId && this.messages.length > 0 && !this.isLoadingMessages) {
            // console.log('Thread already initialized and messages loaded:', newThreadId);
            // If an agent was running for this thread previously and stopped, ensure status is idle.
            if (!this.hasActiveAgentRun && this.agentRunStatus !== 'idle' && this.agentRunStatus !== 'completed' && this.agentRunStatus !== 'stopped' && this.agentRunStatus !== 'error') {
                 this.agentRunStatus = 'idle';
            }
            return;
        }
        this.resetCurrentThreadState(); // Use the new reset action
        this.threadId = newThreadId;
        await this.fetchMessages();
    },

    async fetchMessages() {
      if (!this.threadId) return;
      this.isLoadingMessages = true;
      this.streamError = null; // Clear previous stream errors
      const notifications = useNotificationsStore();
      try {
        const fetchedMessages = await getMessages(this.threadId);
        this.messages = fetchedMessages.map(msg => ({
          ...msg,
          // Content is already parsed in api.js's getMessages
        }));
      } catch (error) { // error is already processed by handleApiError in api.js
        console.error('Error fetching messages:', error);
        this.streamError = { message: error.message || 'Failed to fetch messages.', details: error.details };
        notifications.showError(this.streamError.message);
      } finally {
        this.isLoadingMessages = false;
      }
    },

    async addUserMessage(textContent) {
      if (!this.threadId || this.isSendingMessage || this.hasActiveAgentRun) {
          if(this.hasActiveAgentRun) console.warn("addUserMessage: Agent is currently active. Message not sent.");
          return;
      }
      this.isSendingMessage = true;
      this.streamError = null;
      const notifications = useNotificationsStore();

      const tempUserMessageId = uuidv4();
      const userMessage = { /* ... (same as before) ... */
          message_id: tempUserMessageId, thread_id: this.threadId, type: 'user', role: 'user',
          content: { role: 'user', content: textContent }, created_at: new Date().toISOString(),
          is_llm_message: true, metadata: {}
      };
      this.messages.push(userMessage);

      try {
        const savedMessage = await apiAddUserMessage(this.threadId, textContent);
        if (savedMessage) {
          const msgIndex = this.messages.findIndex(m => m.message_id === tempUserMessageId);
          if (msgIndex !== -1) {
            this.messages[msgIndex] = { ...savedMessage, content: typeof savedMessage.content === 'string' ? JSON.parse(savedMessage.content) : savedMessage.content };
          }

          // Start agent run
          this.agentRunStatus = 'starting';
          const agentConfig = {}; // TODO: Allow passing agent_id or other configs from UI
          const runData = await apiStartAgentRun(this.threadId, agentConfig);
          if (runData && runData.agent_run_id) {
            this.startAgentStream(runData.agent_run_id);
          } else {
            throw new Error('Failed to start agent run or obtain run ID.');
          }
        } else {
            throw new Error('Failed to save user message.');
        }
      } catch (error) { // error from apiAddUserMessage or apiStartAgentRun (already processed by handleApiError)
        console.error('Error adding user message or starting agent:', error);
        this.streamError = { message: error.message || 'Failed to send message or start agent.', details: error.details };
        this.agentRunStatus = 'error';
        notifications.showError(this.streamError.message);
        const msgIndex = this.messages.findIndex(m => m.message_id === tempUserMessageId);
        if (msgIndex !== -1) this.messages[msgIndex].metadata = { ...this.messages[msgIndex].metadata, error: true, errorDetails: this.streamError.message };
      } finally {
        this.isSendingMessage = false;
      }
    },

    startAgentStream(runId) {
      if (this.eventSourceInstance) {
        this.eventSourceInstance.close();
      }
      this.agentRunId = runId;
      this.agentRunStatus = 'connecting';
      this.currentAssistantMessage = '';
      this.currentAssistantMessageId = null;
      this.currentToolCall = null;
      this.streamError = null; // Clear previous stream errors

      this.eventSourceInstance = streamAgentResponse(
        runId,
        () => {
          this.agentRunStatus = 'streaming';
          console.log(`SSE Connection opened for run ID: ${runId}`);
        },
        (data) => {
          this.processSseMessage(data);
        },
        (errorEventOrMessage) => {
          console.error('SSE stream error in store:', errorEventOrMessage);
          const message = errorEventOrMessage?.message || (typeof errorEventOrMessage === 'string' ? errorEventOrMessage : 'Stream connection error.');
          this.streamError = { message, event: errorEventOrMessage };
          this.agentRunStatus = 'error';
          this.stopAgentStream();
          // No global notification here; ChatView can watch streamError
        }
      );
      if (!this.eventSourceInstance) { // Handle case where streamAgentResponse returns null (e.g. no token)
          this.agentRunStatus = 'error';
          this.streamError = { message: 'Failed to initialize agent stream. Authentication token might be missing.' };
          const notifications = useNotificationsStore();
          notifications.showError(this.streamError.message);
      }
    },

    processSseMessage(data) {
        if (!data || !data.type) {
            console.warn('Received SSE message without type:', data);
            return;
        }
        if (data.content && typeof data.content === 'string') {
            try { data.content = JSON.parse(data.content); }
            catch (e) { /* keep as string */ }
        }
        if (data.metadata && typeof data.metadata === 'string') {
            try { data.metadata = JSON.parse(data.metadata); }
            catch (e) { /* keep as string */ }
        }

        switch (data.type) {
            case 'assistant':
                const assistantContent = data.content?.content || '';
                const messageId = data.message_id || this.currentAssistantMessageId || uuidv4();

                if (data.metadata?.stream_status === 'chunk' || !data.message_id) {
                    if (!this.currentAssistantMessageId || this.currentAssistantMessageId !== messageId) {
                        this.currentAssistantMessageId = messageId;
                        this.currentAssistantMessage = assistantContent;
                        this.messages.push({
                            message_id: this.currentAssistantMessageId, thread_id: this.threadId, role: 'assistant', type: 'assistant',
                            content: { role: 'assistant', content: this.currentAssistantMessage },
                            created_at: data.created_at || new Date().toISOString(), is_llm_message: true, metadata: data.metadata || {},
                        });
                    } else {
                        this.currentAssistantMessage += assistantContent;
                        const existingMsgIndex = this.messages.findIndex(m => m.message_id === this.currentAssistantMessageId);
                        if (existingMsgIndex !== -1) {
                            this.messages[existingMsgIndex].content.content = this.currentAssistantMessage;
                            this.messages[existingMsgIndex].updated_at = new Date().toISOString();
                        }
                    }
                    this.agentRunStatus = 'streaming';
                } else if (data.metadata?.stream_status === 'complete' || data.message_id) {
                    const finalContent = this.currentAssistantMessageId === messageId ? this.currentAssistantMessage + assistantContent : assistantContent;
                    const existingMsgIndex = this.messages.findIndex(m => m.message_id === messageId);
                    const finalMessage = {
                        ...data,
                        role: 'assistant', type: 'assistant',
                        content: data.content || {role: 'assistant', content: finalContent},
                        is_llm_message: true,
                    };
                    if (existingMsgIndex !== -1) {
                         this.messages[existingMsgIndex] = finalMessage;
                    } else {
                         this.messages.push(finalMessage);
                    }
                    this.currentAssistantMessage = '';
                    this.currentAssistantMessageId = null;
                }
                break;
            case 'tool':
                this.messages.push({ ...data, role: 'tool', content: data.content || {} });
                this.currentToolCall = null;
                this.agentRunStatus = 'thinking';
                break;
            case 'status':
                const statusContent = data.content || {};
                switch (statusContent.status_type) {
                    case 'thinking': this.agentRunStatus = 'thinking'; this.currentToolCall = null; break;
                    case 'tool_started':
                        this.agentRunStatus = 'tool_started';
                        this.currentToolCall = {
                            id: statusContent.tool_call_id || uuidv4(),
                            name: statusContent.xml_tag_name || statusContent.function_name || 'Unknown Tool',
                            arguments: statusContent.arguments || '{}',
                        };
                        this.currentAssistantMessage = ''; this.currentAssistantMessageId = null; // Stop accumulating text
                        break;
                    case 'tool_completed': case 'tool_failed': case 'tool_error':
                        this.currentToolCall = null; this.agentRunStatus = 'thinking'; break;
                    case 'thread_run_end':
                        this.agentRunStatus = 'completed'; this.stopAgentStream(); this.fetchMessages(); break;
                    case 'error':
                        this.streamError = { message: statusContent.message || 'Agent run failed.', details: statusContent.details };
                        this.agentRunStatus = 'error'; this.stopAgentStream();
                        useNotificationsStore().showError(this.streamError.message);
                        break;
                }
                break;
            case 'ping': break;
            default:
                console.warn('Unhandled SSE message type:', data.type, data);
                if (data.content) this.messages.push({ ...data, message_id: data.message_id || uuidv4(), thread_id: this.threadId, role: data.role || 'system', type: data.type, content: data.content, created_at: data.created_at || new Date().toISOString(), is_llm_message: false, metadata: data.metadata || {} });
        }
    },

    stopAgentStream() {
      if (this.eventSourceInstance) {
        this.eventSourceInstance.close();
        this.eventSourceInstance = null;
        // console.log(`SSE Connection closed for run ID: ${this.agentRunId}`);
      }
      if (this.agentRunStatus === 'connecting' || this.agentRunStatus === 'streaming' || this.agentRunStatus === 'thinking' || this.agentRunStatus === 'tool_started' || this.agentRunStatus === 'tool_output_pending' || this.agentRunStatus === 'starting') {
          this.agentRunStatus = 'stopped';
      }
      this.currentAssistantMessage = ''; // Clear any partial message
      this.currentAssistantMessageId = null;
      // Do not clear currentToolCall here, it might be useful to see the last tool call before stop.
      // Do not clear streamError here, it should persist until a new action.
    },

    handleStreamClosureOrError(error) { // Called by component if SSE closes from client side or error
        if (error) {
            this.streamError = { message: error.message || 'Stream closed with error', event: error };
            if(this.agentRunStatus !== 'error') this.agentRunStatus = 'error'; // Don't override if already error
        } else if (this.agentRunStatus !== 'completed' && this.agentRunStatus !== 'error' && this.agentRunStatus !== 'stopped') {
            this.agentRunStatus = 'stopped'; // Stream closed cleanly but not by a final SSE message
        }
        this.eventSourceInstance = null;
        this.currentAssistantMessage = '';
        this.currentAssistantMessageId = null;
    }
  },
});
