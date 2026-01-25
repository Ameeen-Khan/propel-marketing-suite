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
import { Textarea } from '@/components/ui/textarea';
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

const audienceSchema = z.object({
  name: z.string().min(1, 'Audience name is required').max(100),
  description: z.string().max(500).optional(),
});

// Mock data
const mockAudiences: Audience[] = [
  { id: '1', name: 'New Leads', description: 'Contacts added in the last 30 days', contact_count: 150, created_at: '2024-01-10' },
  { id: '2', name: 'All Contacts', description: 'Complete contact list', contact_count: 500, created_at: '2024-01-01' },
  { id: '3', name: 'Buyers', description: 'Contacts looking to buy property', contact_count: 200, created_at: '2024-02-15', filters: { property_type: ['House', 'Condo'] } },
  { id: '4', name: 'Sellers', description: 'Contacts looking to sell', contact_count: 80, created_at: '2024-03-01' },
  { id: '5', name: 'VIP Clients', description: 'High-value clients', contact_count: 25, created_at: '2024-03-20', filters: { budget_min: 500000 } },
];

const mockContacts: Contact[] = [
  { id: '1', first_name: 'Alice', last_name: 'Johnson', email: 'alice@email.com', property_type: 'House', bedrooms: 3, bathrooms: 2, budget_min: 300000, budget_max: 500000, preferred_location: 'Downtown', custom_tags: ['VIP', 'Hot Lead'], notes: 'Looking for family home', created_at: '2024-01-10' },
  { id: '2', first_name: 'Bob', last_name: 'Smith', email: 'bob@email.com', property_type: 'Condo', bedrooms: 2, bathrooms: 1, budget_min: 200000, budget_max: 350000, preferred_location: 'Suburbs', custom_tags: ['First-time buyer'], notes: '', created_at: '2024-02-15' },
  { id: '3', first_name: 'Carol', last_name: 'Davis', email: 'carol@email.com', property_type: 'Apartment', bedrooms: 1, bathrooms: 1, budget_min: 150000, budget_max: 250000, preferred_location: 'City Center', custom_tags: [], notes: 'First-time buyer', created_at: '2024-03-20' },
  { id: '4', first_name: 'David', last_name: 'Wilson', email: 'david@email.com', property_type: 'House', bedrooms: 4, bathrooms: 3, budget_min: 500000, budget_max: 800000, preferred_location: 'Waterfront', custom_tags: ['VIP', 'Investor'], notes: 'Investment property', created_at: '2024-04-05' },
  { id: '5', first_name: 'Emma', last_name: 'Brown', email: 'emma@email.com', property_type: 'Townhouse', bedrooms: 3, bathrooms: 2, budget_min: 400000, budget_max: 550000, preferred_location: 'Downtown', custom_tags: ['Hot Lead'], notes: '', created_at: '2024-04-10' },
];

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

    // Tags filter
    if (filters.custom_tags?.length && contact.custom_tags) {
      const hasMatchingTag = filters.custom_tags.some((tag) =>
        contact.custom_tags.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }

    // Notes search
    if (filters.notes_search && contact.notes) {
      if (!contact.notes.toLowerCase().includes(filters.notes_search.toLowerCase())) return false;
    }

    return true;
  });
}

export function AudiencesPage() {
  const { toast } = useToast();
  const [audiences, setAudiences] = useState<Audience[]>([]);
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
  const [activeTab, setActiveTab] = useState<'filter' | 'manual'>('filter');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Compute matching contacts based on filters
  const matchingContacts = useMemo(() => {
    return filterContacts(mockContacts, filters);
  }, [filters]);

  useEffect(() => {
    fetchAudiences();
  }, [page, limit, search]);

  const fetchAudiences = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filtered = [...mockAudiences];
    if (search) {
      filtered = filtered.filter(audience =>
        audience.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setTotal(filtered.length);
    setAudiences(filtered.slice((page - 1) * limit, page * limit));
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setFormErrors({});
    setFilters({});
    setSelectedContactIds([]);
    setActiveTab('filter');
  };

  const handleApplyFilters = () => {
    const filtered = filterContacts(mockContacts, filters);
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
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({
      title: 'Audience created',
      description: `${formData.name} has been created with ${selectedContactIds.length} contacts.`,
    });
    setIsCreateOpen(false);
    resetForm();
    fetchAudiences();
    setIsSubmitting(false);
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
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({ title: 'Audience updated', description: 'Audience has been updated.' });
    setIsEditOpen(false);
    setSelectedAudience(null);
    resetForm();
    fetchAudiences();
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedAudience) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({ title: 'Audience deleted', description: `${selectedAudience.name} has been removed.` });
    setIsDeleteOpen(false);
    setSelectedAudience(null);
    fetchAudiences();
    setIsSubmitting(false);
  };

  const handleManageMembers = async () => {
    if (!selectedAudience) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({
      title: 'Members updated',
      description: `${selectedAudience.name} now has ${selectedContactIds.length} contacts.`,
    });
    setIsManageMembersOpen(false);
    setSelectedAudience(null);
    setSelectedContactIds([]);
    setFilters({});
    fetchAudiences();
    setIsSubmitting(false);
  };

  const openEdit = (audience: Audience) => {
    setSelectedAudience(audience);
    setFormData({ name: audience.name, description: audience.description || '' });
    setFilters(audience.filters || {});
    setFormErrors({});
    setIsEditOpen(true);
  };

  const openManageMembers = (audience: Audience) => {
    setSelectedAudience(audience);
    setFilters(audience.filters || {});
    // Pre-select contacts based on existing filters
    const filtered = filterContacts(mockContacts, audience.filters || {});
    setSelectedContactIds(filtered.map((c) => c.id));
    setIsManageMembersOpen(true);
  };

  const toggleContact = (contactId: string) => {
    setSelectedContactIds(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
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
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-muted-foreground" />
          {audience.contact_count.toLocaleString()}
        </div>
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
            <DropdownMenuItem onClick={() => openManageMembers(audience)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Manage Members
            </DropdownMenuItem>
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
              Create a new audience by filtering contacts or selecting them manually.
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

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'filter' | 'manual')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="filter" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filter Contacts
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Manual Selection
                </TabsTrigger>
              </TabsList>

              <TabsContent value="filter" className="mt-4 space-y-4">
                <AudienceFilterPanel
                  contacts={mockContacts}
                  filters={filters}
                  onFiltersChange={setFilters}
                  onApplyFilters={handleApplyFilters}
                  matchingCount={matchingContacts.length}
                />
              </TabsContent>

              <TabsContent value="manual" className="mt-4">
                <ScrollArea className="h-[300px] border rounded-md p-4">
                  <div className="space-y-2">
                    {mockContacts.map((contact) => (
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
                          {contact.property_type}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <div className="text-sm text-muted-foreground border-t pt-4">
              {selectedContactIds.length} contact(s) selected
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Audience
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Audience</DialogTitle>
            <DialogDescription>
              Update audience details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
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
              Adjust filters or manually select contacts for "{selectedAudience?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <AudienceFilterPanel
              contacts={mockContacts}
              filters={filters}
              onFiltersChange={setFilters}
              onApplyFilters={handleApplyFilters}
              matchingCount={matchingContacts.length}
            />

            <ScrollArea className="h-[300px] border rounded-md p-4">
              <div className="space-y-2">
                {mockContacts.map((contact) => (
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
                      {contact.property_type}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="text-sm text-muted-foreground">
              {selectedContactIds.length} contact(s) selected
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsManageMembersOpen(false); setSelectedContactIds([]); setFilters({}); }}>
              Cancel
            </Button>
            <Button onClick={handleManageMembers} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Members
            </Button>
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
