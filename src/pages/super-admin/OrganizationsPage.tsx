import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Organization } from '@/types';
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Users,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from 'lucide-react';
import { z } from 'zod';

const orgSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100, 'Name must be under 100 characters'),
});

// Mock data
const mockOrganizations: Organization[] = [
  { id: '1', name: 'Acme Real Estate', is_active: true, created_at: '2024-01-15T10:00:00Z', agent_count: 12 },
  { id: '2', name: 'Premier Properties', is_active: true, created_at: '2024-02-20T14:30:00Z', agent_count: 8 },
  { id: '3', name: 'Urban Living Realty', is_active: false, created_at: '2024-03-10T09:15:00Z', agent_count: 5 },
  { id: '4', name: 'Coastal Homes Group', is_active: true, created_at: '2024-04-05T16:45:00Z', agent_count: 15 },
  { id: '5', name: 'Mountain View Estates', is_active: true, created_at: '2024-05-12T11:20:00Z', agent_count: 3 },
];

export function OrganizationsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [formName, setFormName] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, [page, limit, search]);

  const fetchOrganizations = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filtered = [...mockOrganizations];
    if (search) {
      filtered = filtered.filter(org =>
        org.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setTotal(filtered.length);
    setOrganizations(filtered.slice((page - 1) * limit, page * limit));
    setIsLoading(false);
  };

  const handleCreate = async () => {
    setFormError('');
    const result = orgSchema.safeParse({ name: formName });
    if (!result.success) {
      setFormError(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({ title: 'Organization created', description: `${formName} has been created successfully.` });
    setIsCreateOpen(false);
    setFormName('');
    fetchOrganizations();
    setIsSubmitting(false);
  };

  const handleEdit = async () => {
    if (!selectedOrg) return;
    setFormError('');
    const result = orgSchema.safeParse({ name: formName });
    if (!result.success) {
      setFormError(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({ title: 'Organization updated', description: `${formName} has been updated successfully.` });
    setIsEditOpen(false);
    setSelectedOrg(null);
    setFormName('');
    fetchOrganizations();
    setIsSubmitting(false);
  };

  const handleToggleActive = async (org: Organization) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newStatus = !org.is_active;
    toast({
      title: newStatus ? 'Organization activated' : 'Organization deactivated',
      description: `${org.name} has been ${newStatus ? 'activated' : 'deactivated'}.`,
    });
    fetchOrganizations();
  };

  const openEdit = (org: Organization) => {
    setSelectedOrg(org);
    setFormName(org.name);
    setFormError('');
    setIsEditOpen(true);
  };

  const columns: Column<Organization>[] = [
    {
      key: 'name',
      header: 'Organization Name',
      cell: (org) => <span className="font-medium">{org.name}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (org) => (
        <StatusBadge variant={org.is_active ? 'active' : 'inactive'}>
          {org.is_active ? 'Active' : 'Inactive'}
        </StatusBadge>
      ),
    },
    {
      key: 'agents',
      header: 'Agents',
      cell: (org) => <span className="text-muted-foreground">{org.agent_count || 0}</span>,
    },
    {
      key: 'created_at',
      header: 'Created',
      cell: (org) => (
        <span className="text-muted-foreground">
          {new Date(org.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      cell: (org) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/sa/organizations/${org.id}`)}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEdit(org)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/sa/organizations/${org.id}/agents`)}>
              <Users className="w-4 h-4 mr-2" />
              Manage Agents
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleActive(org)}>
              {org.is_active ? (
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
      <PageHeader
        title="Organizations"
        description="Manage all organizations on the platform"
        actions={
          <Button onClick={() => { setFormName(''); setFormError(''); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Organization
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={organizations}
        total={total}
        page={page}
        limit={limit}
        totalPages={Math.ceil(total / limit)}
        onPageChange={setPage}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
        onSearch={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Search organizations..."
        isLoading={isLoading}
        emptyMessage="No organizations found"
      />

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Add a new organization to the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter organization name"
                className={formError ? 'border-destructive' : ''}
              />
              {formError && <p className="text-sm text-destructive">{formError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update organization details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-org-name">Organization Name</Label>
              <Input
                id="edit-org-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter organization name"
                className={formError ? 'border-destructive' : ''}
              />
              {formError && <p className="text-sm text-destructive">{formError}</p>}
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
