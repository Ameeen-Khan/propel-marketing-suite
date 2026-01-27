import {
  Organization,
  CreateOrganizationPayload,
  UpdateOrganizationPayload,
  Agent,
  CreateAgentPayload,
  UpdateAgentPayload,
  Contact,
  CreateContactPayload,
  UpdateContactPayload,
  Audience,
  CreateAudiencePayload,
  UpdateAudiencePayload,
  AssignContactsPayload,
  EmailTemplate,
  CreateEmailTemplatePayload,
  UpdateEmailTemplatePayload,
  TestSendPayload,
  Campaign,
  CreateCampaignPayload,
  UpdateCampaignPayload,
  CampaignLog,
  Notification,
  CSVImportJob,
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
  LoginCredentials,
  LoginResponse,
} from '@/types';

// Base API URL - configured for backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  // Store token in localStorage for persistence
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

// Initialize token from localStorage on app start
export const initializeAuth = () => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    authToken = token;
  }
};

// Generic fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'An error occurred',
        errors: data.errors,
      };
    }

    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Build query string from pagination params
function buildQueryString(params: PaginationParams): string {
  const query = new URLSearchParams();
  query.set('page', params.page.toString());
  query.set('limit', params.limit.toString());
  if (params.search) query.set('search', params.search);
  if (params.sort_by) query.set('sort_by', params.sort_by);
  if (params.sort_order) query.set('sort_order', params.sort_order);
  return query.toString();
}

// Auth API
export const authApi = {
  // Super Admin login
  superAdminLogin: (credentials: LoginCredentials) =>
    apiFetch<LoginResponse>('/auth/superadmin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  // Organization Admin/User login
  orgAdminLogin: (credentials: LoginCredentials) =>
    apiFetch<LoginResponse>('/auth/orgadmin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  // Generic login - tries org admin first, then super admin
  login: async (credentials: LoginCredentials) => {
    // Try org admin login first (most common)
    const orgResponse = await apiFetch<LoginResponse>('/auth/orgadmin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (orgResponse.success) {
      return orgResponse;
    }

    // If org admin login fails, try super admin
    return apiFetch<LoginResponse>('/auth/superadmin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Password activation (for new users with invite token)
  activatePassword: (token: string, password: string) =>
    apiFetch<{ message: string }>('/auth/activate', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  // Logout (client-side only for now)
  logout: () => {
    setAuthToken(null);
    return Promise.resolve({ success: true, data: undefined });
  },

  // Get current user info from token (client-side decode)
  me: () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return Promise.resolve({
        success: false,
        message: 'Not authenticated'
      });
    }

    // For now, return success - in production, you'd decode the JWT
    // or make a backend call to verify the token
    return Promise.resolve({
      success: true,
      data: { token } as LoginResponse
    });
  },
};

// Organizations API (Super Admin)
export const organizationsApi = {
  list: (params: PaginationParams) =>
    apiFetch<PaginatedResponse<Organization>>(`/superadmin/orgs?${buildQueryString(params)}`),

  get: (id: string) =>
    apiFetch<Organization>(`/superadmin/orgs/${id}`),

  create: (payload: CreateOrganizationPayload) =>
    apiFetch<Organization>('/superadmin/orgs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: UpdateOrganizationPayload) =>
    apiFetch<Organization>(`/superadmin/orgs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  activate: (id: string) =>
    apiFetch<Organization>(`/superadmin/orgs/${id}/activate`, {
      method: 'POST',
    }),

  deactivate: (id: string) =>
    apiFetch<Organization>(`/superadmin/orgs/${id}/deactivate`, {
      method: 'POST',
    }),
};

// Agents API
export const agentsApi = {
  // List agents - uses different endpoints based on role
  list: (params: PaginationParams, organizationId?: string) => {
    const query = buildQueryString(params);
    // If organizationId is provided, use superadmin route
    if (organizationId) {
      return apiFetch<PaginatedResponse<Agent>>(`/superadmin/orgs/${organizationId}/agents?${query}`);
    }
    // Otherwise use orgadmin route
    return apiFetch<PaginatedResponse<Agent>>(`/orgadmin/agents?${query}`);
  },

  get: (id: string, organizationId?: string) => {
    if (organizationId) {
      return apiFetch<Agent>(`/superadmin/orgs/${organizationId}/agents/${id}`);
    }
    return apiFetch<Agent>(`/orgadmin/agents/${id}`);
  },

  create: (payload: CreateAgentPayload, organizationId?: string) => {
    if (organizationId) {
      return apiFetch<Agent>(`/superadmin/orgs/${organizationId}/agents`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    return apiFetch<Agent>('/orgadmin/agents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update: (id: string, payload: UpdateAgentPayload, organizationId?: string) => {
    if (organizationId) {
      return apiFetch<Agent>(`/superadmin/orgs/${organizationId}/agents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }
    return apiFetch<Agent>(`/orgadmin/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deactivate: (id: string, organizationId?: string) => {
    if (organizationId) {
      return apiFetch<Agent>(`/superadmin/orgs/${organizationId}/agents/${id}`, {
        method: 'DELETE',
      });
    }
    return apiFetch<Agent>(`/orgadmin/agents/${id}`, {
      method: 'DELETE',
    });
  },

  resendInvite: (id: string, organizationId?: string) => {
    if (organizationId) {
      return apiFetch<void>(`/superadmin/orgs/${organizationId}/agents/${id}/regenerate-invite`, {
        method: 'POST',
      });
    }
    return apiFetch<void>(`/orgadmin/agents/${id}/regenerate-invite`, {
      method: 'POST',
    });
  },
};

// Contacts API (Agent routes)
export const contactsApi = {
  list: (params: PaginationParams) =>
    apiFetch<PaginatedResponse<Contact>>(`/agent/contacts?${buildQueryString(params)}`),

  get: (id: string) =>
    apiFetch<Contact>(`/agent/contacts/${id}`),

  create: (payload: CreateContactPayload) =>
    apiFetch<Contact>('/agent/contacts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: UpdateContactPayload) =>
    apiFetch<Contact>(`/agent/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/agent/contacts/${id}`, {
      method: 'DELETE',
    }),

  importCSV: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch<CSVImportJob>('/agent/contacts/import', {
      method: 'POST',
      headers: {}, // Let browser set content-type for FormData
      body: formData as unknown as string,
    });
  },

  getImportStatus: (jobId: string) =>
    apiFetch<CSVImportJob>(`/agent/contacts/import/${jobId}`),

  listImports: (params: PaginationParams) =>
    apiFetch<PaginatedResponse<CSVImportJob>>(`/agent/contacts/imports?${buildQueryString(params)}`),
};

// Audiences API (Agent routes)
export const audiencesApi = {
  list: (params: PaginationParams) =>
    apiFetch<PaginatedResponse<Audience>>(`/agent/audiences?${buildQueryString(params)}`),

  get: (id: string) =>
    apiFetch<Audience>(`/agent/audiences/${id}`),

  create: (payload: CreateAudiencePayload) =>
    apiFetch<Audience>('/agent/audiences', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: UpdateAudiencePayload) =>
    apiFetch<Audience>(`/agent/audiences/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/agent/audiences/${id}`, {
      method: 'DELETE',
    }),

  assignContacts: (id: string, payload: AssignContactsPayload) =>
    apiFetch<Audience>(`/agent/audiences/${id}/contacts`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getContacts: (id: string, params: PaginationParams) =>
    apiFetch<PaginatedResponse<Contact>>(`/agent/audiences/${id}/contacts?${buildQueryString(params)}`),
};

// Email Templates API (Agent routes)
export const emailTemplatesApi = {
  list: (params: PaginationParams) =>
    apiFetch<PaginatedResponse<EmailTemplate>>(`/agent/email-templates?${buildQueryString(params)}`),

  get: (id: string) =>
    apiFetch<EmailTemplate>(`/agent/email-templates/${id}`),

  create: (payload: CreateEmailTemplatePayload) =>
    apiFetch<EmailTemplate>('/agent/email-templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: UpdateEmailTemplatePayload) =>
    apiFetch<EmailTemplate>(`/agent/email-templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/agent/email-templates/${id}`, {
      method: 'DELETE',
    }),

  testSend: (id: string, payload: TestSendPayload) =>
    apiFetch<void>(`/agent/email-templates/${id}/test-send`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// Campaigns API (Agent routes)
export const campaignsApi = {
  list: (params: PaginationParams) =>
    apiFetch<PaginatedResponse<Campaign>>(`/agent/campaigns?${buildQueryString(params)}`),

  get: (id: string) =>
    apiFetch<Campaign>(`/agent/campaigns/${id}`),

  create: (payload: CreateCampaignPayload) =>
    apiFetch<Campaign>('/agent/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: UpdateCampaignPayload) =>
    apiFetch<Campaign>(`/agent/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  pause: (id: string) =>
    apiFetch<Campaign>(`/agent/campaigns/${id}/pause`, {
      method: 'POST',
    }),

  resume: (id: string) =>
    apiFetch<Campaign>(`/agent/campaigns/${id}/resume`, {
      method: 'POST',
    }),

  getLogs: (id: string, params: PaginationParams) =>
    apiFetch<PaginatedResponse<CampaignLog>>(`/agent/campaigns/${id}/logs?${buildQueryString(params)}`),
};

// Notifications API (Agent routes)
export const notificationsApi = {
  list: (params: PaginationParams) =>
    apiFetch<PaginatedResponse<Notification>>(`/agent/notifications?${buildQueryString(params)}`),

  markRead: (id: string) =>
    apiFetch<Notification>(`/agent/notifications/${id}/read`, {
      method: 'POST',
    }),

  markAllRead: () =>
    apiFetch<void>('/agent/notifications/read-all', {
      method: 'POST',
    }),

  getUnreadCount: () =>
    apiFetch<{ count: number }>('/agent/notifications/unread-count'),
};
