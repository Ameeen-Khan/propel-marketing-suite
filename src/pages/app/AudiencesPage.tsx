import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Audience, Contact, AudienceFilters } from '@/types';
import { AudienceFilterPanel } from '@/components/audience/AudienceFilterPanel';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  Loader2,
  Filter,
  UserPlus,
} from 'lucide-react';
import { z } from 'zod';
import { audiencesApi, contactsApi } from '@/services/api';

const audienceSchema = z.object({
  name: z.string().min(1, 'Audience name is required').max(100),
  description: z.string().max(500).optional(),
});

// Filter contacts based on AudienceFilters
function filterContacts(contacts: Contact[], filters: AudienceFilters): Contact[] {
  return contacts.filter((contact) => {
    // Property type filter
    if (filters.property_type?.length && contact.property_type) {
      if (!filters.property_type.includes(contact.property_type)) return false;
    }

    // Bedrooms filter
    if (filters.bedrooms?.length && contact.bedrooms) {
      if (!filters.bedrooms.includes(contact.bedrooms)) return false;
    }

    // Bathrooms filter
    if (filters.bathrooms?.length && contact.bathrooms) {
      if (!filters.bathrooms.includes(contact.bathrooms)) return false;
    }

    // Budget range filter
    if (filters.budget_min !== undefined && contact.budget_max !== undefined) {
      if (contact.budget_max < filters.budget_min) return false;
    }
    if (filters.budget_max !== undefined && contact.budget_min !== undefined) {
      if (contact.budget_min > filters.budget_max) return false;
    }

    // Square feet filter
    if (filters.square_feet_min !== undefined && contact.square_feet !== undefined) {
      if (contact.square_feet < filters.square_feet_min) return false;
    }
    if (filters.square_feet_max !== undefined && contact.square_feet !== undefined) {
      if (contact.square_feet > filters.square_feet_max) return false;
    }

    // Location filter
    if (filters.preferred_location?.length && contact.preferred_location) {
      if (!filters.preferred_location.includes(contact.preferred_location)) return false;
    }

    return true;
  });
}

export function AudiencesPage() {
  const { toast } = useToast();
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<Audience | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filters and member selection
  const [filters, setFilters] = useState<AudienceFilters>({});
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [originalContactIds, setOriginalContactIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'filter' | 'manual'>('filter');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Compute matching contacts based on filters
  const matchingContacts = useMemo(() => {
    return filterContacts(allContacts, filters);
  }, [allContacts, filters]);

  useEffect(() => {
    fetchAudiences();
  }, [page, limit, search, allContacts]); // Re-run when contacts change to update counts

  useEffect(() => {
    fetchAllContacts();
  }, []); // Only fetch contacts once on mount (or maybe on focus)

  const fetchAllContacts = async () => {
    try {
      const response = await contactsApi.list({ page: 1, limit: 1000 });
      console.log('AudiencePage - Contacts Response:', response);

      if (response && response.success && response.data) {
        const responseData = response.data as any;
        const contactsData = responseData.contacts || responseData.data || (Array.isArray(responseData) ? responseData : []);

        if (!Array.isArray(contactsData)) {
          console.warn('AudiencePage - Contacts data is not an array:', contactsData);
          setAllContacts([]);
          return;
        }

        // Normalize if needed
        const normalized = contactsData.map((c: any) => ({
          ...c,
          id: c.id || c.ID,
          first_name: c.first_name || c.FirstName,
          last_name: c.last_name || c.LastName,
          email: c.email || c.Email,
          property_type: c.property_type || c.PropertyType,
          bedrooms: c.bedrooms || c.Bedrooms,
          bathrooms: c.bathrooms || c.Bathrooms,
          budget_min: c.budget_min || c.BudgetMin,
          budget_max: c.budget_max || c.BudgetMax,
          square_feet: c.square_feet || c.SquareFeet,
          preferred_location: c.preferred_location || c.PreferredLocation,
          is_active: c.is_active !== undefined ? c.is_active : (c.IsActive !== undefined ? c.IsActive : true),
        }));

        // Filter out inactive (soft-deleted) contacts
        const activeContacts = normalized.filter((c: any) => c.is_active !== false);

        setAllContacts(activeContacts);
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  const fetchAudiences = async () => {
    setIsLoading(true);
    try {
      const response = await audiencesApi.list({
        page,
        limit,
        search,
        sort_by: 'created_at',
        sort_order: 'desc'
      });
      console.log('AudiencePage - Audiences Response:', response);

      if (response && response.success && response.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const responseData = response.data as any;
        const audiencesData = responseData.audiences || responseData.data || (Array.isArray(responseData) ? responseData : []);

        if (!Array.isArray(audiencesData)) {
          console.warn('AudiencePage - Audiences data is not an array:', audiencesData);
          setAudiences([]);
          setTotal(0);
          return;
        }

        // Normalize
        let normalized = audiencesData.map((a: any) => {
          let count = 0;

          // Priority 1: Backend contacts array length - filter inactive ones
          if (Array.isArray(a.contacts)) {
            // Filter inactive contacts if possible
            const activeContacts = a.contacts.filter((c: any) =>
              (c.is_active !== undefined ? c.is_active : (c.IsActive !== undefined ? c.IsActive : true)) !== false
            );
            count = activeContacts.length;
          } else if (a.contact_count !== undefined) {
            count = a.contact_count;
          } else if (a.ContactCount !== undefined) {
            count = a.ContactCount;
          }

          // Recalculate count for Filtered Audiences client-side to ensure it excludes inactive contacts
          // (Backend count might include them)
          if (a.filters && Object.keys(a.filters).length > 0 && allContacts.length > 0) {
            const matches = filterContacts(allContacts, a.filters);
            count = matches.length;
          }

          return {
            ...a,
            id: a.id || a.ID,
            name: a.name || a.Name,
            description: a.description || a.Description,
            filters: a.filters || a.Filters,
            contact_count: count,
            created_at: (a.created_at || a.CreatedAt || new Date().toISOString()).replace(/Z$/, ''),
            _needsContactFetch: !Array.isArray(a.contacts) && (!a.filters || Object.keys(a.filters).length === 0) // Flag manual audiences that need fetching
          };
        });

        // For manual audiences without contact array, fetch actual contacts to get accurate count
        const audiencesNeedingFetch = normalized.filter((a: any) => a._needsContactFetch);

        if (audiencesNeedingFetch.length > 0) {
          // Fetch contacts for each manual audience to get accurate active count
          Promise.all(
            audiencesNeedingFetch.map(async (audience: any) => {
              try {
                const response = await audiencesApi.getContacts(audience.id, { page: 1, limit: 1000 });
                if (response.success && response.data) {
                  const responseData = response.data as any;
                  const contacts = responseData.contacts || responseData.data || (Array.isArray(responseData) ? responseData : []);
                  const activeContacts = contacts.filter((c: any) =>
                    (c.is_active !== undefined ? c.is_active : (c.IsActive !== undefined ? c.IsActive : true)) !== false
                  );
                  return { id: audience.id, count: activeContacts.length };
                }
              } catch (e) {
                console.error('Failed to fetch contacts for audience', audience.id, e);
              }
              return { id: audience.id, count: audience.contact_count };
            })
          ).then((results) => {
            // Update the normalized array with accurate counts
            setAudiences(prev => prev.map(a => {
              const result = results.find(r => r.id === a.id);
              if (result) {
                return { ...a, contact_count: result.count };
              }
              return a;
            }));
          });
        }


        // Client-side filtering if backend search isn't effective
        if (search) {
          const lowerSearch = search.toLowerCase();
          normalized = normalized.filter((a: any) =>
            a.name.toLowerCase().includes(lowerSearch) ||
            (a.description && a.description.toLowerCase().includes(lowerSearch))
          );
        }

        setAudiences(normalized);
        setTotal(responseData.total || normalized.length || 0);
      } else {
        console.error('AudiencePage - Fetch failed:', response);
        toast({
          title: 'Error',
          description: response?.message || 'Failed to load audiences',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('AudiencePage - Fetch error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audiences',
        variant: 'destructive'
      });
      setAudiences([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setFormErrors({});
    setFilters({});
    setSelectedContactIds([]);
    setOriginalContactIds([]);
    setActiveTab('filter');
  };

  const handleApplyFilters = () => {
    const filtered = filterContacts(allContacts, filters);
    // Overwrite any previously selected contacts with the new filter matches
    setSelectedContactIds(filtered.map((c) => c.id));
    toast({
      title: 'Filters applied',
      description: `${filtered.length} contacts match your criteria.`,
    });
  };

  const handleCreate = async () => {
    setFormErrors({});
    const result = audienceSchema.safeParse(formData);
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
        description: formData.description || undefined,
      };

      // Always use filter mode for creation (manual selection removed from create dialog)
      const hasFilters = Object.keys(filters).length > 0;
      if (hasFilters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value) && value.length === 0) return;
            payload[key] = value;
          }
        });
      }
      payload.contact_ids = undefined;
      payload.filters = undefined;

      const response = await audiencesApi.create(payload);

      if (response.success) {
        const finalCount = matchingContacts.length;

        toast({
          title: 'Audience created',
          description: `${formData.name} has been created with ${finalCount} contacts.`,
        });
        setIsCreateOpen(false);
        resetForm();
        fetchAudiences();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to create audience',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create audience',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedAudience) return;
    setFormErrors({});
    const result = audienceSchema.safeParse(formData);
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
      // Only update name and description
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
      };

      await audiencesApi.update(selectedAudience.id, payload);

      toast({ title: 'Audience updated', description: 'Audience name and description have been updated.' });

      // Optimistically update
      setAudiences(prev => prev.map(a => {
        if (a.id === selectedAudience.id) {
          return {
            ...a,
            name: formData.name,
            description: formData.description,
          };
        }
        return a;
      }));

      setIsEditOpen(false);
      setSelectedAudience(null);
      resetForm();
      fetchAudiences();

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update audience',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAudience) return;
    setIsSubmitting(true);
    try {
      const response = await audiencesApi.delete(selectedAudience.id);
      if (response.success) {
        toast({ title: 'Audience deleted', description: `${selectedAudience.name} has been removed.` });
        setIsDeleteOpen(false);
        setSelectedAudience(null);
        fetchAudiences();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to delete audience',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete audience',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManageMembers = async () => {
    if (!selectedAudience) return;
    setIsSubmitting(true);
    try {
      // Calculate diffs between original and current selection
      const toAdd = selectedContactIds.filter(id => !originalContactIds.includes(id));
      const toRemove = originalContactIds.filter(id => !selectedContactIds.includes(id));

      // Apply additions
      if (toAdd.length > 0) {
        await audiencesApi.assignContacts(selectedAudience.id, {
          contact_ids: toAdd
        });
      }

      // Apply removals
      if (toRemove.length > 0) {
        await audiencesApi.removeContacts(selectedAudience.id, {
          contact_ids: toRemove
        });
      }

      // Clear filters to ensure it becomes a static audience
      const updateResponse = await audiencesApi.update(selectedAudience.id, {
        name: selectedAudience.name,
        description: selectedAudience.description || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        filters: null as any
      });

      if (updateResponse.success) {
        toast({
          title: 'Members updated',
          description: `${selectedAudience.name} now has ${selectedContactIds.length} contacts. Filters have been cleared.`,
        });

        // Optimistically update local state
        setAudiences(prev => prev.map(a =>
          a.id === selectedAudience.id
            ? { ...a, contact_count: selectedContactIds.length, filters: undefined }
            : a
        ));

        setIsManageMembersOpen(false);
        setSelectedAudience(null);
        setSelectedContactIds([]);
        setOriginalContactIds([]);
        setFilters({});
        fetchAudiences();
      } else {
        toast({
          title: 'Warning',
          description: updateResponse.message || 'Members updated but failed to clear filters.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update members',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (audience: Audience) => {
    setSelectedAudience(audience);
    setFormData({ name: audience.name, description: audience.description || '' });
    setFilters(audience.filters || {});
    setFormErrors({});
    setIsEditOpen(true);
  };

  const openManageMembers = async (audience: Audience) => {
    setSelectedAudience(audience);
    setFilters(audience.filters || {});
    setIsManageMembersOpen(true);

    try {
      // Fetch actual assigned contacts from backend
      const response = await audiencesApi.getContacts(audience.id, { page: 1, limit: 1000 });
      if (response.success && response.data) {
        const responseData = response.data as any;
        const contacts = responseData.contacts || responseData.data || (Array.isArray(responseData) ? responseData : []);

        // Filter inactive contacts
        const activeContacts = contacts.filter((c: any) =>
          (c.is_active !== undefined ? c.is_active : (c.IsActive !== undefined ? c.IsActive : true)) !== false
        );

        const ids = activeContacts.map((c: any) => c.id || c.ID);
        setSelectedContactIds(ids);
        setOriginalContactIds(ids); // Track original state for diff calculation
      } else {
        const filtered = filterContacts(allContacts, audience.filters || {});
        const ids = filtered.map((c) => c.id);
        setSelectedContactIds(ids);
        setOriginalContactIds(ids); // Track original state for diff calculation
      }
    } catch (e) {
      console.error('Failed to fetch audience contacts', e);
      // Fallback
      const filtered = filterContacts(allContacts, audience.filters || {});
      const ids = filtered.map((c) => c.id);
      setSelectedContactIds(ids);
      setOriginalContactIds(ids); // Track original state for diff calculation
    }
  };

  const toggleContact = (contactId: string) => {
    setSelectedContactIds(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  // View Contacts Dialog State
  const [isViewContactsOpen, setIsViewContactsOpen] = useState(false);
  const [viewContactsList, setViewContactsList] = useState<Contact[]>([]);
  const [viewContactsLoading, setViewContactsLoading] = useState(false);

  const handleViewContacts = async (audience: Audience) => {
    setSelectedAudience(audience);
    setIsViewContactsOpen(true);
    setViewContactsLoading(true);
    try {
      const response = await audiencesApi.getContacts(audience.id, { page: 1, limit: 100 }); // Reasonable limit for viewing
      if (response.success && response.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const responseData = response.data as any;
        const contacts = responseData.contacts || responseData.data || (Array.isArray(responseData) ? responseData : []);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const normalized = contacts.map((c: any) => ({
          ...c,
          id: c.id || c.ID,
          first_name: c.first_name || c.FirstName,
          last_name: c.last_name || c.LastName,
          email: c.email || c.Email,
          property_type: c.property_type || c.PropertyType,
          is_active: c.is_active !== undefined ? c.is_active : (c.IsActive !== undefined ? c.IsActive : true),
        }));

        // Filter out inactive contacts
        const activeContacts = normalized.filter((c: any) => c.is_active !== false);

        setViewContactsList(activeContacts);
      } else {
        toast({ title: 'Error', description: 'Failed to load contacts', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load contacts', variant: 'destructive' });
    } finally {
      setViewContactsLoading(false);
    }
  };

  const columns: Column<Audience>[] = [
    {
      key: 'name',
      header: 'Audience Name',
      cell: (audience) => <span className="font-medium">{audience.name}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      cell: (audience) => (
        <span className="text-muted-foreground truncate max-w-[250px] block">
          {audience.description || '-'}
        </span>
      ),
    },
    {
      key: 'filters',
      header: 'Filters',
      cell: (audience) => (
        audience.filters && Object.keys(audience.filters).length > 0 ? (
          <div className="flex items-center gap-1 text-primary">
            <Filter className="w-3 h-3" />
            <span className="text-xs">Active</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">None</span>
        )
      ),
    },
    {
      key: 'contacts',
      header: 'Contacts',
      cell: (audience) => (
        <Button
          variant="ghost"
          className="h-auto p-0 hover:bg-transparent hover:underline text-primary flex items-center gap-1 font-normal"
          onClick={() => handleViewContacts(audience)}
        >
          <Users className="w-4 h-4" />
          {audience.contact_count.toLocaleString()}
        </Button>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      cell: (audience) => (
        <span className="text-muted-foreground">
          {new Date(audience.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      cell: (audience) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(audience)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            {/* Only allow Manage Members for manual audiences (no filters) */}
            {(!audience.filters || Object.keys(audience.filters).length === 0) && (
              <DropdownMenuItem onClick={() => openManageMembers(audience)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Manage Members
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => { setSelectedAudience(audience); setIsDeleteOpen(true); }}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Audiences"
        description="Create and manage contact audiences using filters for campaigns"
        actions={
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Audience
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={audiences}
        total={total}
        page={page}
        limit={limit}
        totalPages={Math.ceil(total / limit)}
        onPageChange={setPage}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
        onSearch={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Search audiences..."
        isLoading={isLoading}
        emptyMessage="No audiences found"
      />

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Audience</DialogTitle>
            <DialogDescription>
              Create a new audience by filtering contacts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Audience Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={formErrors.name ? 'border-destructive' : ''}
                />
                {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <AudienceFilterPanel
              contacts={allContacts}
              filters={filters}
              onFiltersChange={setFilters}
              onApplyFilters={handleApplyFilters}
              matchingCount={matchingContacts.length}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Audience ({matchingContacts.length} contacts)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsEditOpen(false);
          setSelectedAudience(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Audience</DialogTitle>
            <DialogDescription>
              Update audience name and description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Audience Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={formErrors.name ? 'border-destructive' : ''}
                />
                {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Members Dialog */}
      <Dialog open={isManageMembersOpen} onOpenChange={(open) => {
        if (!open) {
          setIsManageMembersOpen(false);
          setSelectedAudience(null);
          setSelectedContactIds([]);
          setFilters({});
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Members</DialogTitle>
            <DialogDescription>
              Update members for "{selectedAudience?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Tabs defaultValue="filter">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="filter" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filter Contacts
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Manual Adjustment
                </TabsTrigger>
              </TabsList>

              <TabsContent value="filter" className="mt-4 space-y-4">
                <AudienceFilterPanel
                  contacts={allContacts}
                  filters={filters}
                  onFiltersChange={setFilters}
                  onApplyFilters={handleApplyFilters}
                  matchingCount={matchingContacts.length}
                />
              </TabsContent>

              <TabsContent value="manual" className="mt-4">
                <ScrollArea className="h-[300px] border rounded-md p-4">
                  <div className="space-y-2">
                    {allContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center space-x-3 p-2 rounded hover:bg-muted cursor-pointer"
                        onClick={() => toggleContact(contact.id)}
                      >
                        <Checkbox
                          checked={selectedContactIds.includes(contact.id)}
                          onCheckedChange={() => toggleContact(contact.id)}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{contact.first_name} {contact.last_name}</p>
                          <p className="text-xs text-muted-foreground">{contact.email}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {contact.property_type || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedContactIds.length} contact(s) selected
                </p>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsManageMembersOpen(false); setSelectedContactIds([]); setFilters({}); }}>
              Cancel
            </Button>
            <Button onClick={handleManageMembers} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Members ({selectedContactIds.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Contacts Dialog */}
      <Dialog open={isViewContactsOpen} onOpenChange={setIsViewContactsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contacts in "{selectedAudience?.name}"</DialogTitle>
            <DialogDescription>
              Viewing list of included contacts.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {viewContactsLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <ScrollArea className="h-[400px] border rounded-md">
                {viewContactsList.length > 0 ? (
                  <div className="divide-y">
                    {viewContactsList.map((contact) => (
                      <div key={contact.id} className="p-3 flex items-center justify-between hover:bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{contact.first_name} {contact.last_name}</p>
                          <p className="text-xs text-muted-foreground">{contact.email}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {contact.property_type || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No contacts found in this audience.
                  </div>
                )}
              </ScrollArea>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewContactsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Audience</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedAudience?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
