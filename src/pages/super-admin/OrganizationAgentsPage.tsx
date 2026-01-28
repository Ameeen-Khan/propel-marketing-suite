import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Agent } from '@/types';
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Mail,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { z } from 'zod';
import { agentsApi } from '@/services/api';

const agentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
  email: z.string().email('Please enter a valid email'),
  role: z.enum(['org_admin', 'org_user'], { required_error: 'Role is required' }),
});


export function OrganizationAgentsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: '' as 'org_admin' | 'org_user' | '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAgents();
    }
  }, [page, limit, search, id]);

  const fetchAgents = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await agentsApi.list({
        page,
        limit,
        search,
        sort_by: 'created_at',
        sort_order: 'desc'
      }, id);

      if (response.success && response.data) {
        // Normalize data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const responseData = response.data as any;
        const agentsData = responseData.data || (Array.isArray(responseData) ? responseData : []);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const normalizedAgents = agentsData.map((agent: any) => ({
          ...agent,
          id: agent.id || agent.ID,
          name: agent.name || agent.Name,
          email: agent.email || agent.Email,
          role: agent.role || agent.Role,
          is_active: agent.is_active !== undefined ? agent.is_active : (agent.IsActive !== undefined ? agent.IsActive : false),
          is_password_set: agent.is_password_set !== undefined ? agent.is_password_set : (agent.IsPasswordSet !== undefined ? agent.IsPasswordSet : false),
          created_at: agent.created_at || agent.CreatedAt || new Date().toISOString(),
        }));

        setAgents(normalizedAgents);
        setTotal(responseData.total || normalizedAgents.length || 0);
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to load agents',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load agents',
        variant: 'destructive'
      });
      setAgents([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    setFormErrors({});
    const result = agentSchema.safeParse(formData);
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
      const response = await agentsApi.create({
        name: formData.name,
        email: formData.email,
        role: formData.role as 'org_admin' | 'org_user'
      }, id);

      if (response.success) {
        toast({ title: 'Agent created', description: `Invitation sent to ${formData.email}` });
        setIsCreateOpen(false);
        setFormData({ name: '', email: '', role: '' });
        fetchAgents();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to create agent',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create agent',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedAgent) return;
    setFormErrors({});
    const result = agentSchema.safeParse(formData);
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
      const response = await agentsApi.update(selectedAgent.id, {
        name: formData.name,
        role: formData.role as 'org_admin' | 'org_user'
      }, id);

      if (response.success) {
        toast({ title: 'Agent updated', description: 'Agent details have been updated.' });
        setIsEditOpen(false);
        setSelectedAgent(null);
        setFormData({ name: '', email: '', role: '' });
        fetchAgents();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to update agent',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update agent',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (agent: Agent) => {
    try {
      const response = agent.is_active
        ? await agentsApi.deactivate(agent.id, id)
        : await agentsApi.update(agent.id, { is_active: true }, id);

      if (response.success) {
        toast({
          title: agent.is_active ? 'Agent deactivated' : 'Agent activated',
          description: `${agent.name} has been ${agent.is_active ? 'deactivated' : 'activated'}.`,
        });
        fetchAgents();
      } else {
        toast({
          title: 'Error',
          description: response.message || `Failed to ${agent.is_active ? 'deactivate' : 'activate'} agent`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${agent.is_active ? 'deactivate' : 'activate'} agent`,
        variant: 'destructive'
      });
    }
  };

  const handleResendInvite = async (agent: Agent) => {
    try {
      const response = await agentsApi.resendInvite(agent.id, id);
      if (response.success) {
        toast({ title: 'Invitation sent', description: `Invitation resent to ${agent.email}` });
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to resend invitation',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend invitation',
        variant: 'destructive'
      });
    }
  };

  const openEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormData({ name: agent.name, email: agent.email, role: agent.role });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const columns: Column<Agent>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (agent) => <span className="font-medium">{agent.name}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      cell: (agent) => <span className="text-muted-foreground">{agent.email}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      cell: (agent) => (
        <span className="capitalize">{agent.role.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (agent) => (
        <StatusBadge variant={agent.is_active ? 'active' : 'inactive'}>
          {agent.is_active ? 'Active' : 'Inactive'}
        </StatusBadge>
      ),
    },
    {
      key: 'password',
      header: 'Password Set',
      cell: (agent) => (
        <div className="flex items-center gap-1">
          {agent.is_password_set ? (
            <CheckCircle className="w-4 h-4 text-success" />
          ) : (
            <XCircle className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      cell: (agent) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(agent)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            {!agent.is_password_set && (
              <DropdownMenuItem onClick={() => handleResendInvite(agent)}>
                <Mail className="w-4 h-4 mr-2" />
                Resend Invite
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleToggleActive(agent)} className={agent.is_active ? "text-destructive" : ""}>
              {agent.is_active ? (
                <>
                  <ToggleLeft className="w-4 h-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4 mr-2" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/sa/organizations/${id}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Organization
        </Button>
      </div>

      <PageHeader
        title="Agents"
        description="Manage agents for this organization"
        actions={
          <Button onClick={() => { setFormData({ name: '', email: '', role: '' }); setFormErrors({}); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Agent
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={agents}
        total={total}
        page={page}
        limit={limit}
        totalPages={Math.ceil(total / limit)}
        onPageChange={setPage}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
        onSearch={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Search agents..."
        isLoading={isLoading}
        emptyMessage="No agents found"
      />

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Agent</DialogTitle>
            <DialogDescription>
              Create a new agent and send them an invitation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Name</Label>
              <Input
                id="agent-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter agent name"
                className={formErrors.name ? 'border-destructive' : ''}
              />
              {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-email">Email</Label>
              <Input
                id="agent-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter agent email"
                className={formErrors.email ? 'border-destructive' : ''}
              />
              {formErrors.email && <p className="text-sm text-destructive">{formErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'org_admin' | 'org_user') => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className={formErrors.role ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="org_admin">Org Admin</SelectItem>
                  <SelectItem value="org_user">Org User</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.role && <p className="text-sm text-destructive">{formErrors.role}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create & Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
            <DialogDescription>
              Update agent details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-agent-name">Name</Label>
              <Input
                id="edit-agent-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter agent name"
                className={formErrors.name ? 'border-destructive' : ''}
              />
              {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-agent-email">Email</Label>
              <Input
                id="edit-agent-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter agent email"
                className={formErrors.email ? 'border-destructive' : ''}
              />
              {formErrors.email && <p className="text-sm text-destructive">{formErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-agent-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'org_admin' | 'org_user') => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className={formErrors.role ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="org_admin">Org Admin</SelectItem>
                  <SelectItem value="org_user">Org User</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.role && <p className="text-sm text-destructive">{formErrors.role}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
