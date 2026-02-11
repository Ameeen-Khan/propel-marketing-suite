import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
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
import { Contact, CSVImportResponse } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
  Loader2,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { z } from 'zod';
import { contactsApi } from '@/services/api';

const contactSchema = z.object({
  first_name: z.string()
    .min(2, 'First name must be at least 2 characters')
    .regex(/^[a-zA-Z]+$/, 'First name must contain only alphabetic characters'),
  last_name: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .regex(/^[a-zA-Z]+$/, 'Last name must contain only alphabetic characters'),
  email: z.string()
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email address'),
  phone: z.string()
    .regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),
  property_type: z.string().min(1, 'Property type is required'),
  budget_min: z.number({ invalid_type_error: 'Budget min is required' }).min(0, 'Cannot be negative'),
  budget_max: z.number({ invalid_type_error: 'Budget max is required' }).min(0, 'Cannot be negative'),
  bedrooms: z.number({ invalid_type_error: 'Bedrooms is required' }).min(0).max(5, 'Cannot exceed 5'),
  bathrooms: z.number({ invalid_type_error: 'Bathrooms is required' }).min(0).max(5, 'Cannot exceed 5'),
  square_feet: z.number({ invalid_type_error: 'Square feet is required' }).min(0, 'Cannot be negative'),
  preferred_location: z.string().min(1, 'Preferred location is required'),
}).refine((data) => data.budget_max >= data.budget_min, {
  message: "Max budget cannot be less than min budget",
  path: ["budget_max"],
});

// Animation variant for form fields
const SQFT_OPTIONS = [
  { label: "500 sq ft", value: "500" },
  { label: "1,000 sq ft", value: "1000" },
  { label: "1,500 sq ft", value: "1500" },
  { label: "2,000 sq ft", value: "2000" },
  { label: "2,500 sq ft", value: "2500" },
  { label: "3,000 sq ft", value: "3000" },
  { label: "3,500 sq ft", value: "3500" },
  { label: "4,000 sq ft", value: "4000" },
  { label: "5,000+ sq ft", value: "5000" },
];

const BUDGET_OPTIONS = [
  { label: "₹30L", value: "3000000" },
  { label: "₹50L", value: "5000000" },
  { label: "₹1Cr", value: "10000000" },
  { label: "₹2Cr", value: "20000000" },
  { label: "₹3Cr", value: "30000000" },
  { label: "₹5Cr", value: "50000000" },
  { label: "₹10Cr", value: "100000000" },
  { label: "₹20Cr", value: "200000000" },
  { label: "₹50Cr", value: "500000000" },
];

const formFieldVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export function ContactsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [offsetStart, setOffsetStart] = useState<number | undefined>(undefined);
  const [offsetEnd, setOffsetEnd] = useState<number | undefined>(undefined);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImportSummaryOpen, setIsImportSummaryOpen] = useState(false);
  const [importSummary, setImportSummary] = useState<CSVImportResponse | null>(null);
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
  });

  useEffect(() => {
    fetchContacts();
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);


  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N or Cmd+N for new contact
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        resetForm();
        setIsCreateOpen(true);
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        setIsCreateOpen(false);
        setIsEditOpen(false);
        setIsDeleteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);



  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const response = await contactsApi.list({
        page,
        limit,
        search: debouncedSearch,
        sort_by: 'created_at',
        sort_order: 'desc',
      });

      if (response.success && response.data) {
        console.log('Raw Contacts API Response:', response.data); // DEBUG LOG

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const responseData = response.data as any;
        // Prioritize 'contacts' array as seen in logs
        const contactsData = responseData.contacts || responseData.data || (Array.isArray(responseData) ? responseData : []);

        console.log('Extracted Contacts Data:', contactsData); // DEBUG LOG

        // Normalize data to handle potential backend inconsistency (e.g. PascalCase vs camelCase)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const normalizedContacts = contactsData.map((contact: any) => ({
          ...contact,
          id: contact.id || contact.ID,
          first_name: contact.first_name || contact.FirstName,
          last_name: contact.last_name || contact.LastName,
          email: contact.email || contact.Email,
          phone: contact.phone || contact.Phone,
          property_type: contact.property_type || contact.PropertyType,
          budget_min: contact.budget_min || contact.BudgetMin,
          budget_max: contact.budget_max || contact.BudgetMax,
          bedrooms: contact.bedrooms || contact.Bedrooms,
          bathrooms: contact.bathrooms || contact.Bathrooms,
          square_feet: contact.square_feet || contact.SquareFeet,
          preferred_location: contact.preferred_location || contact.PreferredLocation,
          is_active: contact.is_active !== undefined ? contact.is_active : (contact.IsActive !== undefined ? contact.IsActive : true),
          created_at: contact.created_at || contact.CreatedAt || new Date().toISOString(),
        }));

        // Filter out inactive contacts (soft deleted)
        const activeContacts = normalizedContacts.filter((c: any) => c.is_active !== false);

        setContacts(activeContacts);
        const newTotal = responseData.total || activeContacts.length || 0;
        setTotal(newTotal);
        setOffsetStart(responseData.offset_start);
        setOffsetEnd(responseData.offset_end);

        // If current page is out of bounds (e.g. after searching/filtering returns fewer results), reset to 1
        const calculatedTotalPages = Math.ceil(newTotal / limit);
        if (page > calculatedTotalPages && calculatedTotalPages > 0) {
          setPage(1);
        }
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to load contacts',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load contacts',
        variant: 'destructive'
      });
      setContacts([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
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
    try {
      const response = await contactsApi.create(payload);
      if (response.success) {
        toast({ title: 'Contact created', description: `${formData.first_name} ${formData.last_name} has been added.` });
        setIsCreateOpen(false);
        resetForm();
        fetchContacts();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to create contact',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create contact',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
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
    try {
      const response = await contactsApi.update(selectedContact.id, payload);
      if (response.success) {
        toast({ title: 'Contact updated', description: 'Contact details have been updated.' });
        setIsEditOpen(false);
        setSelectedContact(null);
        resetForm();
        fetchContacts();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to update contact',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update contact',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedContact) return;
    setIsSubmitting(true);
    try {
      console.log('Deleting contact:', selectedContact.id);
      const response = await contactsApi.delete(selectedContact.id);
      if (response.success) {
        toast({ title: 'Contact deleted', description: `${selectedContact.first_name} ${selectedContact.last_name} has been removed.` });

        setIsDeleteOpen(false);
        setSelectedContact(null);

        // Re-fetch to get accurate total count from backend
        fetchContacts();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to delete contact',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete contact',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadCSVTemplate = () => {
    const headers = [
      'first_name', 'last_name', 'email', 'phone',
      'property_type', 'budget_min', 'budget_max',
      'bedrooms', 'bathrooms', 'square_feet', 'preferred_location'
    ];
    // Example data row
    const example = 'John,Cena,johncena@example.com,9876543210,House,3000000,5000000,3,2,1500,Wakad';

    const csvContent = headers.join(',') + '\n' + example;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      toast({
        title: 'Invalid file',
        description: 'Please upload a valid CSV file.',
        variant: 'destructive',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'File size must be less than 5MB.',
        variant: 'destructive',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const response = await contactsApi.importCSV(file);
      if (response.success) {
        const result = response.data as CSVImportResponse;
        setImportSummary(result);
        setIsImportOpen(false);
        setIsImportSummaryOpen(true);
        fetchContacts();

        if (result.imported_records > 0 && result.skipped_records === 0) {
          toast({
            title: 'Import Successful',
            description: `Successfully imported ${result.imported_records} contacts.`,
          });
        } else if (result.imported_records > 0 && result.skipped_records > 0) {
          toast({
            title: 'Import Completed with Skips',
            description: `Imported ${result.imported_records} contacts, skipped ${result.skipped_records}.`,
            variant: 'default',
          });
        } else if (result.imported_records === 0 && result.skipped_records > 0) {
          toast({
            title: 'Import Failed',
            description: `All ${result.skipped_records} contacts were skipped. Check error details.`,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Import failed',
          description: response.message || 'Failed to import CSV',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Import failed',
        description: 'Failed to import CSV file',
        variant: 'destructive'
      });
    } finally {
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
        const min = contact.budget_min ? `₹${contact.budget_min.toLocaleString()}` : '';
        const max = contact.budget_max ? `₹${contact.budget_max.toLocaleString()}` : '';
        return `${min} - ${max}`;
      },
    },
    {
      key: 'created_at',
      header: 'Created',
      cell: (contact) => (
        <span className="text-muted-foreground">
          {formatDate(contact.created_at)}
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
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        }
      />      <div className="flex items-center justify-between mb-2">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or phone..."
            className="pl-10 h-10 border-muted-foreground/20 focus:border-primary transition-all duration-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>      <DataTable
        columns={columns}
        data={contacts}
        total={total}
        page={page}
        limit={limit}
        offsetStart={offsetStart}
        offsetEnd={offsetEnd}
        totalPages={Math.ceil(total / limit)}
        onPageChange={setPage}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}

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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              isEditOpen ? handleEdit() : handleCreate();
            }}
            className="contents"
          >
            <motion.div
              className="grid grid-cols-2 gap-4 py-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05,
                    delayChildren: 0.1
                  }
                }
              }}
            >
              <motion.div className="space-y-2" variants={formFieldVariant}>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z]/g, '');
                    setFormData({ ...formData, first_name: val });
                  }}
                  placeholder="Alphabets only"
                  className={formErrors.first_name ? 'border-destructive' : ''}
                />
                {formErrors.first_name && <p className="text-sm text-destructive">{formErrors.first_name}</p>}
              </motion.div>
              <motion.div className="space-y-2" variants={formFieldVariant}>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z]/g, '');
                    setFormData({ ...formData, last_name: val });
                  }}
                  placeholder="Alphabets only"
                  className={formErrors.last_name ? 'border-destructive' : ''}
                />
                {formErrors.last_name && <p className="text-sm text-destructive">{formErrors.last_name}</p>}
              </motion.div>
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
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    // Allow up to 10 digits
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, phone: val });
                  }}
                  placeholder="10 digits only"
                  className={formErrors.phone ? 'border-destructive' : ''}
                />
                {formErrors.phone && <p className="text-sm text-destructive">{formErrors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="property_type">Property Type *</Label>
                <Select
                  value={formData.property_type}
                  onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                >
                  <SelectTrigger className={formErrors.property_type ? 'border-destructive' : ''}>
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
                {formErrors.property_type && <p className="text-sm text-destructive">{formErrors.property_type}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferred_location">Preferred Location *</Label>
                <Select
                  value={formData.preferred_location}
                  onValueChange={(value) => setFormData({ ...formData, preferred_location: value })}
                >
                  <SelectTrigger className={formErrors.preferred_location ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wakad">Wakad</SelectItem>
                    <SelectItem value="Baner">Baner</SelectItem>
                    <SelectItem value="Koregaon">Koregaon</SelectItem>
                    <SelectItem value="Kondhwa">Kondhwa</SelectItem>
                    <SelectItem value="Balewadi">Balewadi</SelectItem>
                    <SelectItem value="Hinjewadi">Hinjewadi</SelectItem>
                    <SelectItem value="Kharadi">Kharadi</SelectItem>
                    <SelectItem value="Aundh">Aundh</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.preferred_location && <p className="text-sm text-destructive">{formErrors.preferred_location}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_min">Budget Min *</Label>
                <Select
                  value={formData.budget_min}
                  onValueChange={(value) => setFormData({ ...formData, budget_min: value })}
                >
                  <SelectTrigger className={formErrors.budget_min ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select min budget" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.budget_min && <p className="text-sm text-destructive">{formErrors.budget_min}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_max">Budget Max *</Label>
                <Select
                  value={formData.budget_max}
                  onValueChange={(value) => setFormData({ ...formData, budget_max: value })}
                >
                  <SelectTrigger className={formErrors.budget_max ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select max budget" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.budget_max && <p className="text-sm text-destructive">{formErrors.budget_max}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms *</Label>
                <Select
                  value={formData.bedrooms.toString()}
                  onValueChange={(value) => setFormData({ ...formData, bedrooms: value })}
                >
                  <SelectTrigger className={formErrors.bedrooms ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select bedrooms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Studio (0)</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5+</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.bedrooms && <p className="text-sm text-destructive">{formErrors.bedrooms}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms *</Label>
                <Select
                  value={formData.bathrooms.toString()}
                  onValueChange={(value) => setFormData({ ...formData, bathrooms: value })}
                >
                  <SelectTrigger className={formErrors.bathrooms ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select bathrooms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5+</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.bathrooms && <p className="text-sm text-destructive">{formErrors.bathrooms}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="square_feet">Square Feet *</Label>
                <Select
                  value={formData.square_feet}
                  onValueChange={(value) => setFormData({ ...formData, square_feet: value })}
                >
                  <SelectTrigger className={formErrors.square_feet ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select square feet" />
                  </SelectTrigger>
                  <SelectContent>
                    {SQFT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.square_feet && <p className="text-sm text-destructive">{formErrors.square_feet}</p>}
              </div>
            </motion.div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditOpen ? 'Save Changes' : 'Create Contact'}
              </Button>
            </DialogFooter>
          </form>
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

      {/* Import CSV Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Contacts</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import multiple contacts at once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important Requirements</AlertTitle>
              <AlertDescription className="text-xs mt-2 space-y-1">
                <p>• All 11 fields are mandatory. Rows with any empty field will be rejected.</p>
                <p>• Phone numbers must be exactly 10 digits.</p>
                <p>• Duplicate emails or names will be skipped.</p>
                <p>• Notes column is NOT supported.</p>
              </AlertDescription>
            </Alert>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={downloadCSVTemplate}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Sample Template
            </Button>

            <div className="border-t pt-4">
              <Label>Select CSV File</Label>
              <div className="mt-2 flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCSVUpload}
                />
                <Button className="w-full" onClick={() => fileInputRef.current?.click()}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Choose File & Upload
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Max file size: 5MB. Supported formats: .csv
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* CSV Import Summary Dialog */}
      <Dialog open={isImportSummaryOpen} onOpenChange={setIsImportSummaryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              {importSummary && importSummary.imported_records > 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              <DialogTitle>Import Summary</DialogTitle>
            </div>
            <DialogDescription>
              Process results for your CSV upload.
            </DialogDescription>
          </DialogHeader>

          {importSummary && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted p-2 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Total</p>
                  <p className="text-lg font-bold">{importSummary.total_records}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded-lg border border-green-100 dark:border-green-900/50">
                  <p className="text-xs text-green-600 dark:text-green-400 uppercase font-semibold">Success</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{importSummary.imported_records}</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded-lg border border-orange-100 dark:border-orange-900/50">
                  <p className="text-xs text-orange-600 dark:text-orange-400 uppercase font-semibold">Skipped</p>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{importSummary.skipped_records}</p>
                </div>
              </div>

              {importSummary.errors && importSummary.errors.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-destructive uppercase">Error Details</Label>
                  <div className="max-h-[200px] overflow-y-auto rounded-md border border-destructive/20 bg-destructive/5 p-2 space-y-1">
                    {importSummary.errors.map((err, idx) => (
                      <p key={idx} className="text-xs text-destructive flex gap-2">
                        <span className="shrink-0">•</span>
                        <span>{err}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button className="w-full" onClick={() => setIsImportSummaryOpen(false)}>
              Close Summary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
