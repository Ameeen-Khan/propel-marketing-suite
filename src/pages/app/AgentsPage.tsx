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
import { Agent } from '@/types';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  ToggleLeft,
  Mail,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { z } from 'zod';

const agentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Please enter a valid email'),
  role: z.enum(['org_admin', 'org_user'], { required_error: 'Role is required' }),
});

// Mock data
const mockAgents: Agent[] = [
  { id: '1', name: 'John Smith', email: 'john@acme.com', role: 'org_admin', is_active: true, is_password_set: true, organization_id: '1', created_at: '2024-01-20' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@acme.com', role: 'org_user', is_active: true, is_password_set: true, organization_id: '1', created_at: '2024-02-15' },
  { id: '3', name: 'Mike Wilson', email: 'mike@acme.com', role: 'org_user', is_active: true, is_password_set: false, organization_id: '1', created_at: '2024-03-01' },
  { id: '4', name: 'Emily Brown', email: 'emily@acme.com', role: 'org_user', is_active: false, is_password_set: true, organization_id: '1', created_at: '2024-03-10' },
];

export function AgentsPage() {
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
    fetchAgents();
  }, [page, limit, search]);

  const fetchAgents = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filtered = [...mockAgents];
    if (search) {
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(search.toLowerCase()) ||
        agent.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setTotal(filtered.length);
    setAgents(filtered.slice((page - 1) * limit, page * limit));
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', role: '' });
    setFormErrors({});
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
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({ title: 'Agent created', description: `Invitation sent to ${formData.email}` });
    setIsCreateOpen(false);
    resetForm();
    fetchAgents();
    setIsSubmitting(false);
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
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({ title: 'Agent updated', description: 'Agent details have been updated.' });
    setIsEditOpen(false);
    setSelectedAgent(null);
    resetForm();
    fetchAgents();
    setIsSubmitting(false);
  };

  const handleDeactivate = async (agent: Agent) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    toast({ title: 'Agent deactivated', description: `${agent.name} has been deactivated.` });
    fetchAgents();
  };

  const handleResendInvite = async (agent: Agent) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    toast({ title: 'Invitation sent', description: `Invitation resent to ${agent.email}` });
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
            {agent.is_active && (
              <DropdownMenuItem onClick={() => handleDeactivate(agent)} className="text-destructive">
                <ToggleLeft className="w-4 h-4 mr-2" />
                Deactivate
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Agents"
        description="Manage your organization's agents"
        actions={
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
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
