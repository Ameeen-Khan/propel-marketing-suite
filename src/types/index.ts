// User roles
export type UserRole = 'super_admin' | 'org_admin' | 'org_user';

// Auth types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization_id?: string;
  organization_name?: string;
  is_active: boolean;
  is_password_set: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  agent_count?: number;
}

export interface CreateOrganizationPayload {
  name: string;
}

export interface UpdateOrganizationPayload {
  name?: string;
  is_active?: boolean;
}

// Agent types
export interface Agent {
  id: string;
  name: string;
  email: string;
  role: 'org_admin' | 'org_user';
  is_active: boolean;
  is_password_set: boolean;
  organization_id: string;
  created_at: string;
}

export interface CreateAgentPayload {
  name: string;
  email: string;
  role: 'org_admin' | 'org_user';
}

export interface UpdateAgentPayload {
  name?: string;
  role?: 'org_admin' | 'org_user';
  is_active?: boolean;
}

// Contact types
export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  property_type?: string;
  budget_min?: number;
  budget_max?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  preferred_location?: string;
  created_at: string;
}

export interface CreateContactPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  property_type?: string;
  budget_min?: number;
  budget_max?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  preferred_location?: string;
}

export interface UpdateContactPayload extends Partial<CreateContactPayload> {}

// Audience Filter types
export interface AudienceFilters {
  property_type?: string[];
  bedrooms?: number[];
  bathrooms?: number[];
  budget_min?: number;
  budget_max?: number;
  square_feet_min?: number;
  square_feet_max?: number;
  preferred_location?: string[];
}

// Audience types
export interface Audience {
  id: string;
  name: string;
  description?: string;
  filters?: AudienceFilters;
  contact_count: number;
  created_at: string;
}

export interface CreateAudiencePayload {
  name: string;
  description?: string;
  filters?: AudienceFilters;
  contact_ids?: string[];
}

export interface UpdateAudiencePayload {
  name?: string;
  description?: string;
  filters?: AudienceFilters;
}

export interface AssignContactsPayload {
  contact_ids: string[];
}

// Email Template types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  preheader?: string;
  from_name: string;
  html_body: string;
  plain_text_body: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEmailTemplatePayload {
  name: string;
  subject: string;
  preheader?: string;
  from_name: string;
  html_body: string;
  plain_text_body: string;
}

export interface UpdateEmailTemplatePayload extends Partial<CreateEmailTemplatePayload> {}

export interface TestSendPayload {
  email: string;
}

// Campaign types
export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed';
export type ScheduleType = 'once' | 'recurring';
export type RecurrenceMode = 'daily' | 'weekly' | 'monthly';

export interface CampaignRecurrence {
  mode: RecurrenceMode;
  time: string;
  day_of_week?: number; // 0-6 for weekly
  day_of_month?: number; // 1-31 for monthly
}

export interface Campaign {
  id: string;
  name: string;
  template_id: string;
  template_name: string;
  audience_ids: string[];
  audience_names: string[];
  recipients: number;
  schedule_type: ScheduleType;
  scheduled_at?: string;
  recurrence?: CampaignRecurrence;
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignPayload {
  name: string;
  template_id: string;
  audience_ids: string[];
  schedule_type: ScheduleType;
  scheduled_at?: string;
  recurrence?: CampaignRecurrence;
}

export interface UpdateCampaignPayload extends Partial<CreateCampaignPayload> {}

export interface CampaignLog {
  id: string;
  campaign_id: string;
  contact_id: string;
  contact_email: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  sent_at: string;
  opened_at?: string;
  clicked_at?: string;
}

// Notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  is_read: boolean;
  created_at: string;
}

// CSV Import types
export interface CSVImportJob {
  id: string;
  file_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_rows: number;
  processed_rows: number;
  success_count: number;
  error_count: number;
  errors?: string[];
  created_at: string;
  completed_at?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}
