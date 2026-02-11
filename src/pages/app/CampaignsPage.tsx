import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Campaign, CampaignStatus, ScheduleType, RecurrenceMode } from '@/types';
import { cn, formatDateTime, formatTime } from '@/lib/utils';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  FileText,
  Loader2,
  Calendar,
} from 'lucide-react';
import { z } from 'zod';
import { campaignsApi, emailTemplatesApi, audiencesApi } from '@/services/api';
import { CampaignLogsViewer } from './CampaignLogsViewer';

const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(100),
  template_id: z.string().min(1, 'Template is required'),
  audience_ids: z.array(z.string()).min(1, 'At least one audience is required'),
  schedule_type: z.enum(['once', 'recurring']),
  scheduled_at: z.string().optional(),
  recurrence_mode: z.enum(['daily', 'weekly', 'monthly']).or(z.literal('')).optional(),
  recurrence_time: z.string().optional(),
});

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

export function CampaignsPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [audiences, setAudiences] = useState<{ id: string; name: string; contact_count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [offsetStart, setOffsetStart] = useState<number | undefined>(undefined);
  const [offsetEnd, setOffsetEnd] = useState<number | undefined>(undefined);



  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const days = {
    "0": "Sunday",
    "1": "Monday",
    "2": "Tuesday",
    "3": "Wednesday",
    "4": "Thursday",
    "5": "Friday",
    "6": "Saturday"
  }

  const [formData, setFormData] = useState({
    name: '',
    template_id: '',
    audience_ids: [] as string[],
    schedule_type: 'once' as ScheduleType,
    scheduled_at: '',
    recurrence_mode: '' as RecurrenceMode | '',
    recurrence_time: '',
    recurrence_day_of_week: 1, // Monday by default
    recurrence_day_of_month: 1, // 1st of month by default
  });

  useEffect(() => {
    const loadData = async () => {
      // Fetch templates and audiences first, then campaigns
      await Promise.all([fetchTemplates(), fetchAudiences()]);
      await fetchCampaigns();
    };
    loadData();
  }, [page, limit]);

  const fetchTemplates = async () => {
    try {
      const response = await emailTemplatesApi.list({ page: 1, limit: 100 });
      console.log('CampaignsPage - Templates Response:', response); // DEBUG LOG

      if (response.success && response.data) {
        const responseData = response.data as any;
        const templatesData = responseData.templates || responseData.data || (Array.isArray(responseData) ? responseData : []);

        // Normalize
        const normalized = templatesData.map((t: any) => ({
          id: t.id || t.ID,
          name: t.name || t.Name
        }));

        setTemplates(normalized);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchAudiences = async () => {
    try {
      const response = await audiencesApi.list({ page: 1, limit: 100 });
      console.log('CampaignsPage - Audiences Response:', response); // DEBUG LOG

      if (response.success && response.data) {
        const responseData = response.data as any;
        const audiencesData = responseData.audiences || responseData.data || (Array.isArray(responseData) ? responseData : []);

        // Normalize
        const normalized = audiencesData.map((a: any) => ({
          id: a.id || a.ID,
          name: a.name || a.Name,
          contact_count: a.contact_count !== undefined ? a.contact_count : (a.ContactCount !== undefined ? a.ContactCount : 0)
        }));

        setAudiences(normalized);
      }
    } catch (error) {
      console.error('Failed to fetch audiences:', error);
    }
  };

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const response = await campaignsApi.list({
        page,
        limit,
        sort_by: 'created_at',
        sort_order: 'desc'
      });

      console.log('CampaignsPage - Campaigns Response:', response);

      if (response && response.success && response.data) {
        const responseData = response.data as any;
        const campaignsData = responseData.campaigns || responseData.data || (Array.isArray(responseData) ? responseData : []);

        // Normalize
        const normalized = campaignsData.map((c: any) => {
          // Backend now returns recurrence as a string ("daily", "weekly", "monthly")
          const recurrence = c.recurrence || c.Recurrence;
          const scheduledAt = c.scheduled_at || c.ScheduledAt;

          // Extract time from scheduled_at for display (convert UTC to local time)
          let recurrenceTime = '';
          if (scheduledAt && typeof scheduledAt === 'string') {
            const date = new Date(scheduledAt);
            // Use toLocaleTimeString to get local time in HH:MM format
            recurrenceTime = date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
          }

          // Build recurrence object for display (if it's a recurring campaign)
          const normalizedRecurrence = recurrence && typeof recurrence === 'string' ? {
            mode: recurrence,
            time: recurrenceTime,
            day_of_week: c.recurrence_day_of_week || c.RecurrenceDayOfWeek,
            day_of_month: c.recurrence_day_of_month || c.RecurrenceDayOfMonth,
          } : undefined;

          // Safely handle scheduled_at date string
          let normalizedScheduledAt = scheduledAt;
          // No longer stripping 'Z' as it's needed for proper timezone conversion to IST


          // Populate template name from templates list
          const templateId = c.template_id || c.TemplateID || c.TemplateId;
          const template = templates.find(t => t.id === templateId);
          const templateName = template?.name || c.template_name || c.TemplateName || 'Unknown Template';

          // Populate audience names and calculate recipients from audiences list
          const audienceIds = c.audience_ids || c.AudienceIDs || c.AudienceIds || [];
          const matchedAudiences = audiences.filter(a => audienceIds.includes(a.id));
          const audienceNames = matchedAudiences.map(a => a.name);
          const recipientsCount = matchedAudiences.reduce((sum, a) => sum + (a.contact_count || 0), 0);

          return {
            ...c,
            id: c.id || c.ID,
            name: c.name || c.Name,
            status: (c.status || c.Status || 'draft').toLowerCase(),
            template_id: templateId,
            template_name: templateName,
            audience_ids: audienceIds,
            audience_names: audienceNames,
            schedule_type: (c.schedule_type || c.ScheduleType || 'once').toLowerCase(),
            scheduled_at: normalizedScheduledAt,
            recurrence: normalizedRecurrence,
            recipients: recipientsCount || c.recipients || c.Recipients || 0,
            created_at: (c.created_at || c.CreatedAt || new Date().toISOString()).replace(/Z$/, ''),
          };
        });

        setCampaigns(normalized);
        setTotal(responseData.total || normalized.length || 0);
        setOffsetStart(responseData.offset_start);
        setOffsetEnd(responseData.offset_end);
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to load campaigns',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load campaigns',
        variant: 'destructive'
      });
      setCampaigns([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      template_id: '',
      audience_ids: [],
      schedule_type: 'once',
      scheduled_at: '',
      recurrence_mode: '',
      recurrence_time: '',
      recurrence_day_of_week: 1,
      recurrence_day_of_month: 1,
    });
    setFormErrors({});
  };

  const handleCreate = async () => {
    console.log('handleCreate started');
    setFormErrors({});
    const result = campaignSchema.safeParse(formData);

    // Custom validation for scheduled_at
    if (formData.schedule_type === 'once' && !formData.scheduled_at) {
      setFormErrors(prev => ({ ...prev, scheduled_at: 'Schedule time is required for one-time campaigns' }));
      return;
    }

    if (!result.success) {
      console.log('Validation failed', result.error);
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        errors[err.path[0] as string] = err.message;
      });
      setFormErrors(prev => ({ ...prev, ...errors }));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formData.name,
        template_id: formData.template_id,
        audience_ids: formData.audience_ids,
        schedule_type: formData.schedule_type,
      };

      if (formData.schedule_type === 'once' && formData.scheduled_at) {
        // Ensure ISO format with seconds if needed, but datetime-local is usually close enough. 
        // Appending :00Z might be safer to ensure it's treated as UTC or just ISO
        payload.scheduled_at = new Date(formData.scheduled_at).toISOString();
      } else if (formData.schedule_type === 'recurring' && formData.recurrence_mode) {
        // Backend expects recurrence as a string, not an object
        payload.recurrence = formData.recurrence_mode;

        // scheduled_at is required for recurring campaigns (time of day to run)
        const scheduledTime = formData.recurrence_time || new Date().toTimeString().slice(0, 5);
        const today = new Date().toISOString().split('T')[0]; // Get today's date
        // Create date in local time, then convert to ISO (which will add timezone offset)
        payload.scheduled_at = new Date(`${today}T${scheduledTime}:00`).toISOString();

        // Add day_of_week for weekly recurrence (1 = Monday, 0 = Sunday)
        if (formData.recurrence_mode === 'weekly') {
          payload.recurrence_day_of_week = formData.recurrence_day_of_week;
        }

        // Add day_of_month for monthly recurrence
        if (formData.recurrence_mode === 'monthly') {
          payload.recurrence_day_of_month = formData.recurrence_day_of_month;
        }
      }

      console.log('Sending Campaign Payload:', payload);
      const response = await campaignsApi.create(payload);
      console.log('Campaign Create Response:', response);

      if (response.success) {
        toast({ title: 'Campaign created', description: `${formData.name} has been created.` });
        setIsCreateOpen(false);
        resetForm();
        fetchCampaigns();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to create campaign',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Create error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create campaign',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedCampaign) return;
    setFormErrors({});
    const result = campaignSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formData.name,
        template_id: formData.template_id,
        audience_ids: formData.audience_ids,
        schedule_type: formData.schedule_type,
      };

      if (formData.schedule_type === 'once' && formData.scheduled_at) {
        payload.scheduled_at = formData.scheduled_at;
      } else if (formData.schedule_type === 'recurring' && formData.recurrence_mode) {
        // Backend expects recurrence as a string, not an object
        payload.recurrence = formData.recurrence_mode;

        // scheduled_at is required for recurring campaigns (time of day to run)
        const scheduledTime = formData.recurrence_time || new Date().toTimeString().slice(0, 5);
        const today = new Date().toISOString().split('T')[0];
        // Create date in local time, then convert to ISO
        payload.scheduled_at = new Date(`${today}T${scheduledTime}:00`).toISOString();

        // Add day_of_week for weekly recurrence
        if (formData.recurrence_mode === 'weekly') {
          payload.recurrence_day_of_week = formData.recurrence_day_of_week;
        }

        // Add day_of_month for monthly recurrence
        if (formData.recurrence_mode === 'monthly') {
          payload.recurrence_day_of_month = formData.recurrence_day_of_month;
        }
      }

      const response = await campaignsApi.update(selectedCampaign.id, payload);
      if (response.success) {
        toast({ title: 'Campaign updated', description: 'Campaign has been updated.' });
        setIsEditOpen(false);
        setSelectedCampaign(null);
        resetForm();
        fetchCampaigns();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to update campaign',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update campaign',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const openEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      template_id: campaign.template_id,
      audience_ids: campaign.audience_ids,
      schedule_type: campaign.schedule_type,
      scheduled_at: campaign.scheduled_at || '',
      recurrence_mode: campaign.recurrence?.mode || '',
      recurrence_time: campaign.recurrence?.time || '',
      recurrence_day_of_week: campaign.recurrence?.day_of_week || 1,
      recurrence_day_of_month: campaign.recurrence?.day_of_month || 1,
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const toggleAudience = (audienceId: string) => {
    setFormData(prev => ({
      ...prev,
      audience_ids: prev.audience_ids.includes(audienceId)
        ? prev.audience_ids.filter(id => id !== audienceId)
        : [...prev.audience_ids, audienceId],
    }));
  };

  const getStatusVariant = (status: CampaignStatus) => {
    const map: Record<CampaignStatus, 'active' | 'inactive' | 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'draft' | 'scheduled'> = {
      draft: 'draft',
      scheduled: 'scheduled',
      running: 'running',
      paused: 'paused',
      completed: 'completed',
      failed: 'failed',
    };
    return map[status];
  };

  const columns: Column<Campaign>[] = [
    {
      key: 'name',
      header: 'Campaign Name',
      cell: (campaign) => <span className="font-medium">{campaign.name}</span>,
    },
    {
      key: 'schedule',
      header: 'Schedule',
      cell: (campaign) => {
        if (campaign.schedule_type === 'recurring' && campaign.recurrence) {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          let scheduleText = campaign.recurrence.mode.charAt(0).toUpperCase() + campaign.recurrence.mode.slice(1);

          if (campaign.recurrence.mode === 'weekly' && campaign.recurrence.day_of_week !== undefined) {
            scheduleText += ` (${days[campaign.recurrence.day_of_week]})`;
          } else if (campaign.recurrence.mode === 'monthly' && campaign.recurrence.day_of_month) {
            scheduleText += ` (${campaign.recurrence.day_of_month}${getOrdinalSuffix(campaign.recurrence.day_of_month)})`;
          }

          if (campaign.recurrence.time) {
            scheduleText += ` at ${formatTime(campaign.recurrence.time)}`;
          }

          return scheduleText;
        }
        if (campaign.scheduled_at) {
          return formatDateTime(campaign.scheduled_at);
        }
        return '-';
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (campaign) => (
        <StatusBadge variant={getStatusVariant(campaign.status)}>
          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      cell: (campaign) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(campaign)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSelectedCampaign(campaign); setIsLogsOpen(true); }}>
              <FileText className="w-4 h-4 mr-2" />
              View Logs
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Campaigns"
        description="Create and manage email marketing campaigns targeting audiences"
        actions={
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={campaigns}
        total={total}
        page={page}
        limit={limit}
        offsetStart={offsetStart}
        offsetEnd={offsetEnd}
        totalPages={Math.ceil(total / limit)}
        onPageChange={setPage}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}

        isLoading={isLoading}
        emptyMessage="No campaigns found"
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setIsEditOpen(false);
          setSelectedCampaign(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditOpen ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
            <DialogDescription>
              {isEditOpen ? 'Update campaign details.' : 'Set up a new email campaign targeting audiences.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={formErrors.name ? 'border-destructive' : ''}
              />
              {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Email Template *</Label>
              <Select
                value={formData.template_id}
                onValueChange={(value) => setFormData({ ...formData, template_id: value })}
              >
                <SelectTrigger className={formErrors.template_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.template_id && <p className="text-sm text-destructive">{formErrors.template_id}</p>}
            </div>

            <div className="space-y-2">
              <Label>Target Audiences *</Label>
              <div className="border rounded-md p-3 space-y-2">
                {audiences.map((audience) => (
                  <label
                    key={audience.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={formData.audience_ids.includes(audience.id)}
                      onCheckedChange={() => toggleAudience(audience.id)}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{audience.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({audience.contact_count} contacts)
                      </span>
                    </div>
                  </label>
                ))}
              </div>
              {formErrors.audience_ids && <p className="text-sm text-destructive">{formErrors.audience_ids}</p>}
            </div>

            <div className="space-y-2">
              <Label>Schedule Type *</Label>
              <Select
                value={formData.schedule_type}
                onValueChange={(value: ScheduleType) => setFormData({ ...formData, schedule_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">One-time</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.schedule_type === 'once' && (
              <div className="space-y-2">
                <Label htmlFor="scheduled_at">Scheduled Date & Time</Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  className={formErrors.scheduled_at ? 'border-destructive' : ''}
                />
                {formErrors.scheduled_at && <p className="text-sm text-destructive">{formErrors.scheduled_at}</p>}
              </div>
            )}

            {formData.schedule_type === 'recurring' && (
              <>
                <div className="space-y-2">
                  <Label>Recurrence</Label>
                  <Select
                    value={formData.recurrence_mode}
                    onValueChange={(value: RecurrenceMode) => setFormData({ ...formData, recurrence_mode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.recurrence_mode === 'weekly' && (
                  <div className="space-y-2">
                    <Label htmlFor="recurrence_day_of_week">Day of Week</Label>
                    <Select
                      value={formData.recurrence_day_of_week.toString()}
                      onValueChange={(value) => setFormData({ ...formData, recurrence_day_of_week: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(days).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.recurrence_mode === 'monthly' && (
                  <div className="space-y-2">
                    <Label htmlFor="recurrence_day_of_month">Day of Month</Label>
                    <Input
                      id="recurrence_day_of_month"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.recurrence_day_of_month}
                      onChange={(e) => setFormData({ ...formData, recurrence_day_of_month: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="recurrence_time">Time</Label>
                  <Input
                    id="recurrence_time"
                    type="time"
                    value={formData.recurrence_time}
                    onChange={(e) => setFormData({ ...formData, recurrence_time: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={isEditOpen ? handleEdit : handleCreate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditOpen ? 'Save Changes' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={isLogsOpen} onOpenChange={setIsLogsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Campaign Logs</DialogTitle>
            <DialogDescription>
              Delivery logs for "{selectedCampaign?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <CampaignLogsViewer campaignId={selectedCampaign?.id} isOpen={isLogsOpen} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
