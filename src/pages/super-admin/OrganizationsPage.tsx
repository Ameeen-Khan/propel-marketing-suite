import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn, formatDate } from '@/lib/utils';
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
import { organizationsApi, agentsApi } from '@/services/api';

const orgSchema = z.object({
  name: z.string()
    .min(1, 'Organization name cannot be empty')
    .max(100, 'Name must be under 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain alphabetic characters and spaces')
    .refine((val) => !val.includes('  '), 'Name cannot contain multiple consecutive spaces'),
});

export function OrganizationsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [total, setTotal] = useState(0);

  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [formName, setFormName] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all data once (or on mutation)
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Filter and paginate locally whenever data, page, or limit changes
  useEffect(() => {
    let filtered = allOrganizations;

    setTotal(filtered.length);

    // Auto-correct page if out of bounds due to filtering
    const totalPages = Math.ceil(filtered.length / limit);
    if (page > totalPages && totalPages > 0) {
      setPage(1);
    }

    // Client-side pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    setOrganizations(filtered.slice(start, end));

  }, [allOrganizations, page, limit]);

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      // Fetch all organizations (use a high limit to get everything)
      const response = await organizationsApi.list({
        page: 1,
        limit: 1000,
        sort_by: 'created_at',
        sort_order: 'desc'
      });

      if (response.success && response.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const responseData = response.data as any;
        const orgsData = responseData.data || (Array.isArray(responseData) ? responseData : []);

        // Normalize data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const normalizedOrgs = orgsData.map((org: any) => ({
          ...org,
          id: org.id || org.ID,
          name: org.name || org.Name,
          is_active: org.is_active !== undefined ? org.is_active : (org.IsActive !== undefined ? org.IsActive : false),
          created_at: org.created_at || org.CreatedAt || new Date().toISOString(),
          agent_count: org.agent_count || org.AgentCount || 0,
        }));

        setAllOrganizations(normalizedOrgs);

        // Fetch agent counts for each org in background
        // We do this after setting initial state to show data fast
        const orgsWithCounts = await Promise.all(
          normalizedOrgs.map(async (org: Organization) => {
            try {
              const agentsRes = await agentsApi.list({ page: 1, limit: 1 }, org.id);
              if (agentsRes.success && agentsRes.data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const resData = agentsRes.data as any;
                const count = resData.total !== undefined
                  ? resData.total
                  : (Array.isArray(resData) ? resData.length : (resData.data ? resData.data.length : 0));

                return { ...org, agent_count: count };
              }
            } catch (e) {
              // Ignore error
            }
            return org;
          })
        );

        setAllOrganizations(orgsWithCounts);
        setIsLoading(false);

      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to load organizations',
          variant: 'destructive'
        });
        setIsLoading(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load organizations',
        variant: 'destructive'
      });
      setAllOrganizations([]);
      setTotal(0);
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    setFormError('');
    const result = orgSchema.safeParse({ name: formName });
    if (!result.success) {
      setFormError(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await organizationsApi.create({ name: formName });
      if (response.success) {
        toast({ title: 'Organization created', description: `${formName} has been created successfully.` });
        setIsCreateOpen(false);
        setFormName('');
        setPage(1); // Reset to first page to see the new organization
        fetchOrganizations();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to create organization',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create organization',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
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
    try {
      const response = await organizationsApi.update(selectedOrg.id, { name: formName });
      if (response.success) {
        toast({ title: 'Organization updated', description: `${formName} has been updated successfully.` });
        setIsEditOpen(false);
        setSelectedOrg(null);
        setFormName('');
        fetchOrganizations();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to update organization',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update organization',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (org: Organization) => {
    try {
      const response = org.is_active
        ? await organizationsApi.deactivate(org.id)
        : await organizationsApi.activate(org.id);

      if (response.success) {
        const newStatus = !org.is_active;
        toast({
          title: newStatus ? 'Organization activated' : 'Organization deactivated',
          description: `${org.name} has been ${newStatus ? 'activated' : 'deactivated'}.`,
        });
        fetchOrganizations();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to update organization status',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update organization status',
        variant: 'destructive'
      });
    }
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
      cell: (org) => (
        <span
          className="font-medium text-primary hover:underline cursor-pointer"
          onClick={() => navigate(`/sa/organizations/${org.id}`)}
        >
          {org.name}
        </span>
      ),
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
          {formatDate(org.created_at)}
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
            <DropdownMenuItem onClick={() => navigate(`/ sa / organizations / ${org.id}/agents`)}>
              <Users className="w-4 h-4 mr-2" />
              Manage Agents
            </DropdownMenuItem >
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
          </DropdownMenuContent >
        </DropdownMenu >
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
          <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
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
              <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
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
          <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
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
              <Button variant="outline" type="button" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
