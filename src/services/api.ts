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

// Base API URL - will be configured for actual backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
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
  login: (credentials: LoginCredentials) =>
    apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  logout: () =>
    apiFetch<void>('/auth/logout', {
      method: 'POST',
    }),

  me: () => apiFetch<LoginResponse>('/auth/me'),
};

// Organizations API (Super Admin)
export const organizationsApi = {
  list: (params: PaginationParams) =>
    apiFetch<PaginatedResponse<Organization>>(`/organizations?${buildQueryString(params)}`),

  get: (id: string) =>
    apiFetch<Organization>(`/organizations/${id}`),

  create: (payload: CreateOrganizationPayload) =>
    apiFetch<Organization>('/organizations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: UpdateOrganizationPayload) =>
    apiFetch<Organization>(`/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  activate: (id: string) =>
    apiFetch<Organization>(`/organizations/${id}/activate`, {
      method: 'POST',
    }),

  deactivate: (id: string) =>
    apiFetch<Organization>(`/organizations/${id}/deactivate`, {
      method: 'POST',
    }),
};

// Agents API
export const agentsApi = {
  list: (params: PaginationParams, organizationId?: string) => {
    const query = buildQueryString(params);
    const endpoint = organizationId
      ? `/organizations/${organizationId}/agents?${query}`
      : `/agents?${query}`;
    return apiFetch<PaginatedResponse<Agent>>(endpoint);
  },

  get: (id: string) =>
    apiFetch<Agent>(`/agents/${id}`),

  create: (payload: CreateAgentPayload, organizationId?: string) => {
    const endpoint = organizationId
      ? `/organizations/${organizationId}/agents`
      : '/agents';
    return apiFetch<Agent>(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update: (id: string, payload: UpdateAgentPayload) =>
    apiFetch<Agent>(`/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deactivate: (id: string) =>
    apiFetch<Agent>(`/agents/${id}/deactivate`, {
      method: 'POST',
    }),

  resendInvite: (id: string) =>
    apiFetch<void>(`/agents/${id}/resend-invite`, {
      method: 'POST',
    }),
};

// Contacts API
export const contactsApi = {
  list: (params: PaginationParams) =>
    apiFetch<PaginatedResponse<Contact>>(`/contacts?${buildQueryString(params)}`),

  get: (id: string) =>
    apiFetch<Contact>(`/contacts/${id}`),

  create: (payload: CreateContactPayload) =>
    apiFetch<Contact>('/contacts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: UpdateContactPayload) =>
    apiFetch<Contact>(`/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/contacts/${id}`, {
      method: 'DELETE',
    }),

  importCSV: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch<CSVImportJob>('/contacts/import', {
      method: 'POST',
      headers: {}, // Let browser set content-type for FormData
      body: formData as unknown as string,
    });
  },

  getImportStatus: (jobId: string) =>
    apiFetch<CSVImportJob>(`/contacts/import/${jobId}`),

  listImports: (params: PaginationParams) =>
    apiFetch<PaginatedResponse<CSVImportJob>>(`/contacts/imports?${buildQueryString(params)}`),
};

// Audiences API
export const audiencesApi = {
  list: (params: PaginationParams) =>
    apiFetch<PaginatedResponse<Audience>>(`/audiences?${buildQueryString(params)}`),

  get: (id: string) =>
    apiFetch<Audience>(`/audiences/${id}`),

  create: (payload: CreateAudiencePayload) =>
    apiFetch<Audience>('/audiences', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: UpdateAudiencePayload) =>
    apiFetch<Audience>(`/audiences/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/audiences/${id}`, {
      method: 'DELETE',
    }),

  assignContacts: (id: string, payload: AssignContactsPayload) =>
    apiFetch<Audience>(`/audiences/${id}/contacts`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getContacts: (id: string, params: PaginationParams) =>
    apiFetch<PaginatedResponse<Contact>>(`/audiences/${id}/contacts?${buildQueryString(params)}`),
};

// Email Templates API
export const emailTemplatesApi = {
  list: (params: PaginationParams) =>
    apiFetch<PaginatedResponse<EmailTemplate>>(`/email-templates?${buildQueryString(params)}`),

  get: (id: string) =>
    apiFetch<EmailTemplate>(`/email-templates/${id}`),

  create: (payload: CreateEmailTemplatePayload) =>
    apiFetch<EmailTemplate>('/email-templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: UpdateEmailTemplatePayload) =>
    apiFetch<EmailTemplate>(`/email-templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/email-templates/${id}`, {
      method: 'DELETE',
    }),

  testSend: (id: string, payload: TestSendPayload) =>
    apiFetch<void>(`/email-templates/${id}/test`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// Campaigns API
export const campaignsApi = {
  list: (params: PaginationParams) =>
    apiFetch<PaginatedResponse<Campaign>>(`/campaigns?${buildQueryString(params)}`),

  get: (id: string) =>
    apiFetch<Campaign>(`/campaigns/${id}`),

  create: (payload: CreateCampaignPayload) =>
    apiFetch<Campaign>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: UpdateCampaignPayload) =>
    apiFetch<Campaign>(`/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  pause: (id: string) =>
    apiFetch<Campaign>(`/campaigns/${id}/pause`, {
      method: 'POST',
    }),

  resume: (id: string) =>
    apiFetch<Campaign>(`/campaigns/${id}/resume`, {
      method: 'POST',
    }),

  getLogs: (id: string, params: PaginationParams) =>
    apiFetch<PaginatedResponse<CampaignLog>>(`/campaigns/${id}/logs?${buildQueryString(params)}`),
};

// Notifications API
export const notificationsApi = {
  list: (params: PaginationParams) =>
    apiFetch<PaginatedResponse<Notification>>(`/notifications?${buildQueryString(params)}`),

  markRead: (id: string) =>
    apiFetch<Notification>(`/notifications/${id}/read`, {
      method: 'POST',
    }),

  markAllRead: () =>
    apiFetch<void>('/notifications/read-all', {
      method: 'POST',
    }),

  getUnreadCount: () =>
    apiFetch<{ count: number }>('/notifications/unread-count'),
};
