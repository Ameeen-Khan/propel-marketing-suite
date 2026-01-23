import { useState, useEffect, useRef } from 'react';
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
import { Contact } from '@/types';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
  Loader2,
} from 'lucide-react';
import { z } from 'zod';

const contactSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  property_type: z.string().optional(),
  budget_min: z.number().optional(),
  budget_max: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  square_feet: z.number().optional(),
  preferred_location: z.string().optional(),
  notes: z.string().optional(),
});

// Mock data
const mockContacts: Contact[] = [
  { id: '1', first_name: 'Alice', last_name: 'Johnson', email: 'alice@email.com', phone: '+1-555-0101', property_type: 'House', budget_min: 300000, budget_max: 500000, bedrooms: 3, bathrooms: 2, square_feet: 2000, preferred_location: 'Downtown', preferences: ['Pool', 'Garden'], notes: 'Looking for family home', created_at: '2024-01-10' },
  { id: '2', first_name: 'Bob', last_name: 'Smith', email: 'bob@email.com', phone: '+1-555-0102', property_type: 'Condo', budget_min: 200000, budget_max: 350000, bedrooms: 2, bathrooms: 1, square_feet: 1200, preferred_location: 'Suburbs', preferences: ['Gym', 'Parking'], notes: '', created_at: '2024-02-15' },
  { id: '3', first_name: 'Carol', last_name: 'Davis', email: 'carol@email.com', phone: '+1-555-0103', property_type: 'Apartment', budget_min: 150000, budget_max: 250000, bedrooms: 1, bathrooms: 1, square_feet: 800, preferred_location: 'City Center', preferences: ['Balcony'], notes: 'First-time buyer', created_at: '2024-03-20' },
  { id: '4', first_name: 'David', last_name: 'Wilson', email: 'david@email.com', phone: '+1-555-0104', property_type: 'House', budget_min: 500000, budget_max: 800000, bedrooms: 4, bathrooms: 3, square_feet: 3500, preferred_location: 'Waterfront', preferences: ['Pool', 'Garage', 'View'], notes: 'Investment property', created_at: '2024-04-05' },
];

export function ContactsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    property_type: '',
    budget_min: '',
    budget_max: '',
    bedrooms: '',
    bathrooms: '',
    square_feet: '',
    preferred_location: '',
    notes: '',
  });

  useEffect(() => {
    fetchContacts();
  }, [page, limit, search]);

  const fetchContacts = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filtered = [...mockContacts];
    if (search) {
      filtered = filtered.filter(contact =>
        `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        contact.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setTotal(filtered.length);
    setContacts(filtered.slice((page - 1) * limit, page * limit));
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      property_type: '',
      budget_min: '',
      budget_max: '',
      bedrooms: '',
      bathrooms: '',
      square_feet: '',
      preferred_location: '',
      notes: '',
    });
    setFormErrors({});
  };

  const handleCreate = async () => {
    setFormErrors({});
    const payload = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone || undefined,
      property_type: formData.property_type || undefined,
      budget_min: formData.budget_min ? Number(formData.budget_min) : undefined,
      budget_max: formData.budget_max ? Number(formData.budget_max) : undefined,
      bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
      square_feet: formData.square_feet ? Number(formData.square_feet) : undefined,
      preferred_location: formData.preferred_location || undefined,
      notes: formData.notes || undefined,
    };

    const result = contactSchema.safeParse(payload);
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
    
    toast({ title: 'Contact created', description: `${formData.first_name} ${formData.last_name} has been added.` });
    setIsCreateOpen(false);
    resetForm();
    fetchContacts();
    setIsSubmitting(false);
  };

  const handleEdit = async () => {
    if (!selectedContact) return;
    setFormErrors({});
    
    const payload = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone || undefined,
      property_type: formData.property_type || undefined,
      budget_min: formData.budget_min ? Number(formData.budget_min) : undefined,
      budget_max: formData.budget_max ? Number(formData.budget_max) : undefined,
      bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
      square_feet: formData.square_feet ? Number(formData.square_feet) : undefined,
      preferred_location: formData.preferred_location || undefined,
      notes: formData.notes || undefined,
    };

    const result = contactSchema.safeParse(payload);
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
    
    toast({ title: 'Contact updated', description: 'Contact details have been updated.' });
    setIsEditOpen(false);
    setSelectedContact(null);
    resetForm();
    fetchContacts();
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedContact) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({ title: 'Contact deleted', description: `${selectedContact.first_name} ${selectedContact.last_name} has been removed.` });
    setIsDeleteOpen(false);
    setSelectedContact(null);
    fetchContacts();
    setIsSubmitting(false);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    toast({
      title: 'Import started',
      description: `Processing ${file.name}...`,
    });
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone || '',
      property_type: contact.property_type || '',
      budget_min: contact.budget_min?.toString() || '',
      budget_max: contact.budget_max?.toString() || '',
      bedrooms: contact.bedrooms?.toString() || '',
      bathrooms: contact.bathrooms?.toString() || '',
      square_feet: contact.square_feet?.toString() || '',
      preferred_location: contact.preferred_location || '',
      notes: contact.notes || '',
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const columns: Column<Contact>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (contact) => (
        <span className="font-medium">{contact.first_name} {contact.last_name}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      cell: (contact) => <span className="text-muted-foreground">{contact.email}</span>,
    },
    {
      key: 'phone',
      header: 'Phone',
      cell: (contact) => <span className="text-muted-foreground">{contact.phone || '-'}</span>,
    },
    {
      key: 'property_type',
      header: 'Property Type',
      cell: (contact) => contact.property_type || '-',
    },
    {
      key: 'budget',
      header: 'Budget',
      cell: (contact) => {
        if (!contact.budget_min && !contact.budget_max) return '-';
        const min = contact.budget_min ? `$${contact.budget_min.toLocaleString()}` : '';
        const max = contact.budget_max ? `$${contact.budget_max.toLocaleString()}` : '';
        return `${min} - ${max}`;
      },
    },
    {
      key: 'created_at',
      header: 'Created',
      cell: (contact) => (
        <span className="text-muted-foreground">
          {new Date(contact.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      cell: (contact) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(contact)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => { setSelectedContact(contact); setIsDeleteOpen(true); }}
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
        title="Contacts"
        description="Manage your real estate contacts"
        actions={
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCSVUpload}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={contacts}
        total={total}
        page={page}
        limit={limit}
        totalPages={Math.ceil(total / limit)}
        onPageChange={setPage}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
        onSearch={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Search contacts..."
        isLoading={isLoading}
        emptyMessage="No contacts found"
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setIsEditOpen(false);
          setSelectedContact(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditOpen ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
            <DialogDescription>
              {isEditOpen ? 'Update contact details.' : 'Add a new contact to your list.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className={formErrors.first_name ? 'border-destructive' : ''}
              />
              {formErrors.first_name && <p className="text-sm text-destructive">{formErrors.first_name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className={formErrors.last_name ? 'border-destructive' : ''}
              />
              {formErrors.last_name && <p className="text-sm text-destructive">{formErrors.last_name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={formErrors.email ? 'border-destructive' : ''}
              />
              {formErrors.email && <p className="text-sm text-destructive">{formErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="property_type">Property Type</Label>
              <Select
                value={formData.property_type}
                onValueChange={(value) => setFormData({ ...formData, property_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="House">House</SelectItem>
                  <SelectItem value="Condo">Condo</SelectItem>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="Townhouse">Townhouse</SelectItem>
                  <SelectItem value="Land">Land</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred_location">Preferred Location</Label>
              <Input
                id="preferred_location"
                value={formData.preferred_location}
                onChange={(e) => setFormData({ ...formData, preferred_location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_min">Budget Min ($)</Label>
              <Input
                id="budget_min"
                type="number"
                value={formData.budget_min}
                onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_max">Budget Max ($)</Label>
              <Input
                id="budget_max"
                type="number"
                value={formData.budget_max}
                onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="square_feet">Square Feet</Label>
              <Input
                id="square_feet"
                type="number"
                value={formData.square_feet}
                onChange={(e) => setFormData({ ...formData, square_feet: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              {isEditOpen ? 'Save Changes' : 'Create Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedContact?.first_name} {selectedContact?.last_name}? This action cannot be undone.
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
