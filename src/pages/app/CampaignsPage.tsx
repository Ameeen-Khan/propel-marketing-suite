import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
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
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Pause,
  Play,
  FileText,
  Loader2,
  Calendar,
} from 'lucide-react';
import { z } from 'zod';

const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(100),
  template_id: z.string().min(1, 'Template is required'),
  audience_id: z.string().min(1, 'Audience is required'),
  schedule_type: z.enum(['once', 'recurring']),
  scheduled_at: z.string().optional(),
  recurrence_mode: z.enum(['daily', 'weekly', 'monthly']).optional(),
  recurrence_time: z.string().optional(),
});

// Mock data
const mockCampaigns: Campaign[] = [
  { id: '1', name: 'Welcome Series', template_id: '1', template_name: 'Welcome Email', audience_id: '1', audience_name: 'New Leads', recipients: 150, schedule_type: 'once', scheduled_at: '2024-04-15T10:00:00Z', status: 'completed', created_at: '2024-04-10', updated_at: '2024-04-15' },
  { id: '2', name: 'Weekly Newsletter', template_id: '3', template_name: 'Monthly Newsletter', audience_id: '2', audience_name: 'All Contacts', recipients: 500, schedule_type: 'recurring', recurrence: { mode: 'weekly', time: '09:00', day_of_week: 1 }, status: 'running', created_at: '2024-03-01', updated_at: '2024-04-20' },
  { id: '3', name: 'New Listing Alert', template_id: '2', template_name: 'New Listing Alert', audience_id: '3', audience_name: 'Buyers', recipients: 200, schedule_type: 'once', scheduled_at: '2024-04-25T14:00:00Z', status: 'scheduled', created_at: '2024-04-18', updated_at: '2024-04-18' },
  { id: '4', name: 'Monthly Market Update', template_id: '3', template_name: 'Monthly Newsletter', audience_id: '2', audience_name: 'All Contacts', recipients: 500, schedule_type: 'recurring', recurrence: { mode: 'monthly', time: '10:00', day_of_month: 1 }, status: 'paused', created_at: '2024-02-01', updated_at: '2024-04-01' },
];

const mockTemplates = [
  { id: '1', name: 'Welcome Email' },
  { id: '2', name: 'New Listing Alert' },
  { id: '3', name: 'Monthly Newsletter' },
];

const mockAudiences = [
  { id: '1', name: 'New Leads', contact_count: 150 },
  { id: '2', name: 'All Contacts', contact_count: 500 },
  { id: '3', name: 'Buyers', contact_count: 200 },
];

export function CampaignsPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    template_id: '',
    audience_id: '',
    schedule_type: 'once' as ScheduleType,
    scheduled_at: '',
    recurrence_mode: '' as RecurrenceMode | '',
    recurrence_time: '',
  });

  useEffect(() => {
    fetchCampaigns();
  }, [page, limit, search]);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filtered = [...mockCampaigns];
    if (search) {
      filtered = filtered.filter(campaign =>
        campaign.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setTotal(filtered.length);
    setCampaigns(filtered.slice((page - 1) * limit, page * limit));
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      template_id: '',
      audience_id: '',
      schedule_type: 'once',
      scheduled_at: '',
      recurrence_mode: '',
      recurrence_time: '',
    });
    setFormErrors({});
  };

  const handleCreate = async () => {
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
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({ title: 'Campaign created', description: `${formData.name} has been created.` });
    setIsCreateOpen(false);
    resetForm();
    fetchCampaigns();
    setIsSubmitting(false);
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
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({ title: 'Campaign updated', description: 'Campaign has been updated.' });
    setIsEditOpen(false);
    setSelectedCampaign(null);
    resetForm();
    fetchCampaigns();
    setIsSubmitting(false);
  };

  const handlePauseResume = async (campaign: Campaign) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const action = campaign.status === 'running' ? 'paused' : 'resumed';
    toast({ title: `Campaign ${action}`, description: `${campaign.name} has been ${action}.` });
    fetchCampaigns();
  };

  const openEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      template_id: campaign.template_id,
      audience_id: campaign.audience_id,
      schedule_type: campaign.schedule_type,
      scheduled_at: campaign.scheduled_at || '',
      recurrence_mode: campaign.recurrence?.mode || '',
      recurrence_time: campaign.recurrence?.time || '',
    });
    setFormErrors({});
    setIsEditOpen(true);
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
      key: 'template',
      header: 'Template',
      cell: (campaign) => campaign.template_name,
    },
    {
      key: 'recipients',
      header: 'Recipients',
      cell: (campaign) => campaign.recipients.toLocaleString(),
    },
    {
      key: 'schedule',
      header: 'Schedule',
      cell: (campaign) => {
        if (campaign.schedule_type === 'recurring' && campaign.recurrence) {
          return `${campaign.recurrence.mode} at ${campaign.recurrence.time}`;
        }
        if (campaign.scheduled_at) {
          return new Date(campaign.scheduled_at).toLocaleString();
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
            {(campaign.status === 'running' || campaign.status === 'paused') && (
              <DropdownMenuItem onClick={() => handlePauseResume(campaign)}>
                {campaign.status === 'running' ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </>
                )}
              </DropdownMenuItem>
            )}
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
        description="Create and manage email marketing campaigns"
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
        totalPages={Math.ceil(total / limit)}
        onPageChange={setPage}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
        onSearch={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Search campaigns..."
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
              {isEditOpen ? 'Update campaign details.' : 'Set up a new email campaign.'}
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
                  {mockTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.template_id && <p className="text-sm text-destructive">{formErrors.template_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience *</Label>
              <Select
                value={formData.audience_id}
                onValueChange={(value) => setFormData({ ...formData, audience_id: value })}
              >
                <SelectTrigger className={formErrors.audience_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  {mockAudiences.map((audience) => (
                    <SelectItem key={audience.id} value={audience.id}>
                      {audience.name} ({audience.contact_count} contacts)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.audience_id && <p className="text-sm text-destructive">{formErrors.audience_id}</p>}
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
                />
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Campaign Logs</DialogTitle>
            <DialogDescription>
              Delivery logs for "{selectedCampaign?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-md border">
              <div className="p-4 text-center text-muted-foreground">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No logs available yet</p>
                <p className="text-sm">Logs will appear once emails are sent</p>
              </div>
            </div>
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
