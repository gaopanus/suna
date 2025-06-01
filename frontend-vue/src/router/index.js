import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import HomeView from '@/views/HomeView.vue';
import LoginView from '@/views/LoginView.vue';
import SignupView from '@/views/SignupView.vue';
import ChatView from '@/views/ChatView.vue';
import ProjectListView from '@/views/ProjectListView.vue';
import ProjectDetailView from '@/views/ProjectDetailView.vue';

// Agent Management Views
import AgentMarketplaceView from '@/views/AgentMarketplaceView.vue';
import MyAgentsView from '@/views/MyAgentsView.vue';
import AgentDetailView from '@/views/AgentDetailView.vue';
import AgentFormView from '@/views/AgentFormView.vue';

// Settings and Billing Views
import SettingsView from '@/views/SettingsView.vue';
import BillingView from '@/views/BillingView.vue';

import { useAuthStore } from '@/store/auth';
import pinia from '@/store';

const authStore = useAuthStore(pinia);

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'HomeRedirect',
        redirect: '/projects',
      },
      {
        path: 'projects',
        name: 'ProjectList',
        component: ProjectListView,
      },
      {
        path: 'project/:projectId',
        name: 'ProjectDetail',
        component: ProjectDetailView,
        props: true,
      },
      {
        path: 'project/:projectId/thread/:threadId',
        name: 'Chat',
        component: ChatView,
        props: true,
      },
      // Agent Routes
      {
        path: 'agents/marketplace',
        name: 'AgentMarketplace',
        component: AgentMarketplaceView,
      },
      {
        path: 'agents/my-agents',
        name: 'MyAgents',
        component: MyAgentsView,
      },
      {
        path: 'agent/create',
        name: 'AgentCreate',
        component: AgentFormView,
      },
      {
        path: 'agent/:agentId',
        name: 'AgentDetail',
        component: AgentDetailView,
        props: true,
      },
      {
        path: 'agent/:agentId/edit',
        name: 'AgentEdit',
        component: AgentFormView,
        props: true,
      },
      // Settings & Billing Routes
      {
        path: 'settings',
        name: 'Settings',
        component: SettingsView,
      },
      {
        path: 'billing',
        name: 'Billing',
        component: BillingView,
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { guestOnly: true }
  },
  {
    path: '/signup',
    name: 'Signup',
    component: SignupView,
    meta: { guestOnly: true }
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  if (!authStore.session && localStorage.getItem('supabase_session') && !authStore.isLoading) {
    await authStore.fetchCurrentSession();
  } else if (authStore.isLoading) {
    // Consider a more robust way to handle this, e.g. a loading screen or store flag
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const guestOnly = to.matched.some(record => record.meta.guestOnly);
  const isAuthenticated = authStore.isAuthenticated;

  if (requiresAuth && !isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
  } else if (guestOnly && isAuthenticated) {
    next({ name: 'ProjectList' });
  } else {
    next();
  }
});

export default router;
