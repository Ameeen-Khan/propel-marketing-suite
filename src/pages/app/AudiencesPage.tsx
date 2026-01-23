import { useState, useEffect } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Audience, Contact } from '@/types';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  Loader2,
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
  { id: '3', name: 'Buyers', description: 'Contacts looking to buy property', contact_count: 200, created_at: '2024-02-15' },
  { id: '4', name: 'Sellers', description: 'Contacts looking to sell', contact_count: 80, created_at: '2024-03-01' },
  { id: '5', name: 'VIP Clients', description: 'High-value clients', contact_count: 25, created_at: '2024-03-20' },
];

const mockContacts: Contact[] = [
  { id: '1', first_name: 'Alice', last_name: 'Johnson', email: 'alice@email.com', preferences: [], created_at: '2024-01-10' },
  { id: '2', first_name: 'Bob', last_name: 'Smith', email: 'bob@email.com', preferences: [], created_at: '2024-02-15' },
  { id: '3', first_name: 'Carol', last_name: 'Davis', email: 'carol@email.com', preferences: [], created_at: '2024-03-20' },
  { id: '4', first_name: 'David', last_name: 'Wilson', email: 'david@email.com', preferences: [], created_at: '2024-04-05' },
  { id: '5', first_name: 'Emma', last_name: 'Brown', email: 'emma@email.com', preferences: [], created_at: '2024-04-10' },
];

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
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<Audience | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

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
    
    toast({ title: 'Audience created', description: `${formData.name} has been created.` });
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

  const handleAssignContacts = async () => {
    if (!selectedAudience) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({
      title: 'Contacts assigned',
      description: `${selectedContactIds.length} contacts added to ${selectedAudience.name}.`,
    });
    setIsAssignOpen(false);
    setSelectedAudience(null);
    setSelectedContactIds([]);
    fetchAudiences();
    setIsSubmitting(false);
  };

  const openEdit = (audience: Audience) => {
    setSelectedAudience(audience);
    setFormData({ name: audience.name, description: audience.description || '' });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const openAssign = (audience: Audience) => {
    setSelectedAudience(audience);
    setSelectedContactIds([]);
    setIsAssignOpen(true);
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
            <DropdownMenuItem onClick={() => openAssign(audience)}>
              <Users className="w-4 h-4 mr-2" />
              Assign Contacts
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
        description="Create and manage contact audiences for campaigns"
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

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setIsEditOpen(false);
          setSelectedAudience(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditOpen ? 'Edit Audience' : 'Create Audience'}</DialogTitle>
            <DialogDescription>
              {isEditOpen ? 'Update audience details.' : 'Create a new contact audience.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={isEditOpen ? handleEdit : handleCreate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditOpen ? 'Save Changes' : 'Create Audience'}
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

      {/* Assign Contacts Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Contacts</DialogTitle>
            <DialogDescription>
              Add contacts to "{selectedAudience?.name}"
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] border rounded-md p-4">
            <div className="space-y-3">
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
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="text-sm text-muted-foreground">
            {selectedContactIds.length} contact(s) selected
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAssignOpen(false); setSelectedContactIds([]); }}>
              Cancel
            </Button>
            <Button onClick={handleAssignContacts} disabled={isSubmitting || selectedContactIds.length === 0}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Assign Contacts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
