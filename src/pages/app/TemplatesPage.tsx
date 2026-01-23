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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { EmailTemplate } from '@/types';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Send,
  Loader2,
  Code,
  FileText,
} from 'lucide-react';
import { z } from 'zod';

const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100),
  subject: z.string().min(1, 'Subject is required').max(200),
  preheader: z.string().max(200).optional(),
  from_name: z.string().min(1, 'From name is required').max(100),
  reply_to: z.string().email('Please enter a valid email'),
  html_body: z.string().min(1, 'HTML body is required'),
  plain_text_body: z.string().min(1, 'Plain text body is required'),
});

// Mock data
const mockTemplates: EmailTemplate[] = [
  { id: '1', name: 'Welcome Email', subject: 'Welcome to {{company_name}}!', preheader: 'Start your journey', from_name: 'Acme Real Estate', reply_to: 'hello@acme.com', html_body: '<h1>Welcome!</h1><p>Thank you for joining us.</p>', plain_text_body: 'Welcome! Thank you for joining us.', created_at: '2024-01-15', updated_at: '2024-01-15' },
  { id: '2', name: 'New Listing Alert', subject: 'New Property: {{property_name}}', preheader: 'Check out this listing', from_name: 'Listings Team', reply_to: 'listings@acme.com', html_body: '<h1>New Listing</h1><p>We found a property you might like.</p>', plain_text_body: 'New Listing: We found a property you might like.', created_at: '2024-02-20', updated_at: '2024-03-01' },
  { id: '3', name: 'Monthly Newsletter', subject: 'Your Monthly Market Update', preheader: 'Market trends and tips', from_name: 'Newsletter', reply_to: 'newsletter@acme.com', html_body: '<h1>Monthly Update</h1><p>Here is your market update.</p>', plain_text_body: 'Monthly Update: Here is your market update.', created_at: '2024-03-10', updated_at: '2024-03-15' },
];

export function TemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isTestSendOpen, setIsTestSendOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [testEmail, setTestEmail] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    preheader: '',
    from_name: '',
    reply_to: '',
    html_body: '',
    plain_text_body: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, [page, limit, search]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filtered = [...mockTemplates];
    if (search) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(search.toLowerCase()) ||
        template.subject.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setTotal(filtered.length);
    setTemplates(filtered.slice((page - 1) * limit, page * limit));
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      preheader: '',
      from_name: '',
      reply_to: '',
      html_body: '',
      plain_text_body: '',
    });
    setFormErrors({});
  };

  const handleCreate = async () => {
    setFormErrors({});
    const result = templateSchema.safeParse(formData);
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
    
    toast({ title: 'Template created', description: `${formData.name} has been created.` });
    setIsCreateOpen(false);
    resetForm();
    fetchTemplates();
    setIsSubmitting(false);
  };

  const handleEdit = async () => {
    if (!selectedTemplate) return;
    setFormErrors({});
    const result = templateSchema.safeParse(formData);
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
    
    toast({ title: 'Template updated', description: 'Template has been updated.' });
    setIsEditOpen(false);
    setSelectedTemplate(null);
    resetForm();
    fetchTemplates();
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({ title: 'Template deleted', description: `${selectedTemplate.name} has been removed.` });
    setIsDeleteOpen(false);
    setSelectedTemplate(null);
    fetchTemplates();
    setIsSubmitting(false);
  };

  const handleTestSend = async () => {
    if (!selectedTemplate || !testEmail) return;
    const emailResult = z.string().email().safeParse(testEmail);
    if (!emailResult.success) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({ title: 'Test email sent', description: `Test email sent to ${testEmail}` });
    setIsTestSendOpen(false);
    setTestEmail('');
    setSelectedTemplate(null);
    setIsSubmitting(false);
  };

  const openEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      preheader: template.preheader || '',
      from_name: template.from_name,
      reply_to: template.reply_to,
      html_body: template.html_body,
      plain_text_body: template.plain_text_body,
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const columns: Column<EmailTemplate>[] = [
    {
      key: 'name',
      header: 'Template Name',
      cell: (template) => <span className="font-medium">{template.name}</span>,
    },
    {
      key: 'subject',
      header: 'Subject',
      cell: (template) => (
        <span className="text-muted-foreground truncate max-w-[250px] block">{template.subject}</span>
      ),
    },
    {
      key: 'from_name',
      header: 'From',
      cell: (template) => template.from_name,
    },
    {
      key: 'updated_at',
      header: 'Last Updated',
      cell: (template) => (
        <span className="text-muted-foreground">
          {new Date(template.updated_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      cell: (template) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(template)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSelectedTemplate(template); setIsTestSendOpen(true); }}>
              <Send className="w-4 h-4 mr-2" />
              Test Send
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => { setSelectedTemplate(template); setIsDeleteOpen(true); }}
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
        title="Email Templates"
        description="Create and manage email templates for campaigns"
        actions={
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={templates}
        total={total}
        page={page}
        limit={limit}
        totalPages={Math.ceil(total / limit)}
        onPageChange={setPage}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
        onSearch={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Search templates..."
        isLoading={isLoading}
        emptyMessage="No templates found"
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setIsEditOpen(false);
          setSelectedTemplate(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditOpen ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>
              {isEditOpen ? 'Update template details and content.' : 'Create a new email template.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={formErrors.name ? 'border-destructive' : ''}
                />
                {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Use {{variable}} for dynamic content"
                  className={formErrors.subject ? 'border-destructive' : ''}
                />
                {formErrors.subject && <p className="text-sm text-destructive">{formErrors.subject}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="from_name">From Name *</Label>
                <Input
                  id="from_name"
                  value={formData.from_name}
                  onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                  className={formErrors.from_name ? 'border-destructive' : ''}
                />
                {formErrors.from_name && <p className="text-sm text-destructive">{formErrors.from_name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reply_to">Reply To *</Label>
                <Input
                  id="reply_to"
                  type="email"
                  value={formData.reply_to}
                  onChange={(e) => setFormData({ ...formData, reply_to: e.target.value })}
                  className={formErrors.reply_to ? 'border-destructive' : ''}
                />
                {formErrors.reply_to && <p className="text-sm text-destructive">{formErrors.reply_to}</p>}
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="preheader">Preheader</Label>
                <Input
                  id="preheader"
                  value={formData.preheader}
                  onChange={(e) => setFormData({ ...formData, preheader: e.target.value })}
                  placeholder="Preview text shown in inbox"
                />
              </div>
            </div>

            <Tabs defaultValue="html" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="html" className="gap-2">
                  <Code className="w-4 h-4" />
                  HTML Body
                </TabsTrigger>
                <TabsTrigger value="plain" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Plain Text
                </TabsTrigger>
              </TabsList>
              <TabsContent value="html" className="mt-4">
                <div className="space-y-2">
                  <Label>HTML Body *</Label>
                  <Textarea
                    value={formData.html_body}
                    onChange={(e) => setFormData({ ...formData, html_body: e.target.value })}
                    className={`font-mono text-sm min-h-[300px] ${formErrors.html_body ? 'border-destructive' : ''}`}
                    placeholder="<html>...</html>"
                  />
                  {formErrors.html_body && <p className="text-sm text-destructive">{formErrors.html_body}</p>}
                </div>
              </TabsContent>
              <TabsContent value="plain" className="mt-4">
                <div className="space-y-2">
                  <Label>Plain Text Body *</Label>
                  <Textarea
                    value={formData.plain_text_body}
                    onChange={(e) => setFormData({ ...formData, plain_text_body: e.target.value })}
                    className={`min-h-[300px] ${formErrors.plain_text_body ? 'border-destructive' : ''}`}
                    placeholder="Plain text version of your email..."
                  />
                  {formErrors.plain_text_body && <p className="text-sm text-destructive">{formErrors.plain_text_body}</p>}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={isEditOpen ? handleEdit : handleCreate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditOpen ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTemplate?.name}"? This action cannot be undone.
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

      {/* Test Send Dialog */}
      <Dialog open={isTestSendOpen} onOpenChange={setIsTestSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email using the "{selectedTemplate?.name}" template.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Email Address</Label>
              <Input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsTestSendOpen(false); setTestEmail(''); }}>
              Cancel
            </Button>
            <Button onClick={handleTestSend} disabled={isSubmitting || !testEmail}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
