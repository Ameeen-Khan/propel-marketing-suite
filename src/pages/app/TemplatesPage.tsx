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
import { useAuth } from '@/contexts/AuthContext';
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
import { emailTemplatesApi } from '@/services/api';

const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100),
  subject: z.string().min(1, 'Subject is required').max(200),
  preheader: z.string().max(200).optional(),
  from_name: z.string().min(1, 'From name is required').max(100),
  html_body: z.string().optional(),
  plain_text_body: z.string().optional(),
}).refine(data => data.html_body || data.plain_text_body, {
  message: "At least one of HTML body or Plain Text body is required",
  path: ["html_body"]
});

export function TemplatesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
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

  // Default from_name to organization name
  const defaultFromName = user?.organization_name || 'Your Organization';

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    preheader: '',
    from_name: defaultFromName,
    html_body: '',
    plain_text_body: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, [page, limit, search]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await emailTemplatesApi.list({
        page,
        limit,
        search,
        sort_by: 'updated_at',
        sort_order: 'desc'
      });

      if (response.success && response.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const responseData = response.data as any;
        // Prioritize 'templates' array similar to how contacts was 'contacts'
        const templatesData = responseData.templates || responseData.data || (Array.isArray(responseData) ? responseData : []);

        // Normalize if needed (PascalCase to snake_case)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const normalizedTemplates = templatesData.map((template: any) => ({
          ...template,
          id: template.id || template.ID,
          name: template.name || template.Name,
          subject: template.subject || template.Subject,
          preheader: template.preheader || template.Preheader,
          from_name: template.from_name || template.FromName,
          html_body: template.html_body || template.HtmlBody,
          plain_text_body: template.plain_text_body || template.PlainTextBody,
          created_at: template.created_at || template.CreatedAt || new Date().toISOString(),
          updated_at: template.updated_at || template.UpdatedAt || new Date().toISOString(),
          organization_id: template.organization_id || template.OrganizationID,
        }));

        setTemplates(normalizedTemplates);
        setTotal(responseData.total || normalizedTemplates.length || 0);
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to load templates',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive'
      });
      setTemplates([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      preheader: '',
      from_name: defaultFromName,
      html_body: '',
      plain_text_body: '',
    });
    setFormErrors({});
  };

  const handleCreate = async () => {
    setFormErrors({});

    // Auto-generate plain text logic removed
    const submissionData = { ...formData };

    const result = templateSchema.safeParse(submissionData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);

      // Show toast for validation error since fields might be in hidden tabs
      toast({
        title: 'Validation Error',
        description: 'Please check the form for errors. Ensure both HTML and Plain Text bodies are filled.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await emailTemplatesApi.create(submissionData);
      if (response.success) {
        toast({ title: 'Template created', description: `${submissionData.name} has been created.` });
        setIsCreateOpen(false);
        resetForm();
        fetchTemplates();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to create template',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedTemplate) return;
    setFormErrors({});

    // Auto-generate plain text logic removed
    const submissionData = { ...formData };

    const result = templateSchema.safeParse(submissionData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);

      // Show toast for validation error
      toast({
        title: 'Validation Error',
        description: 'Please check the form for errors. Ensure both HTML and Plain Text bodies are filled.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await emailTemplatesApi.update(selectedTemplate.id, submissionData);
      if (response.success) {
        toast({ title: 'Template updated', description: 'Template has been updated.' });
        setIsEditOpen(false);
        setSelectedTemplate(null);
        resetForm();
        fetchTemplates();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to update template',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    setIsSubmitting(true);
    try {
      const response = await emailTemplatesApi.delete(selectedTemplate.id);
      if (response.success) {
        toast({ title: 'Template deleted', description: `${selectedTemplate.name} has been removed.` });
        setIsDeleteOpen(false);
        setSelectedTemplate(null);
        fetchTemplates();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to delete template',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestSend = async () => {
    if (!selectedTemplate || !testEmail) return;
    const emailResult = z.string().email().safeParse(testEmail);
    if (!emailResult.success) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Backend error "test_email is required" confirmed we need this exact key
      const payload = { test_email: testEmail };
      console.log('Sending test email payload:', payload);

      const response = await emailTemplatesApi.testSend(selectedTemplate.id, payload as any);
      console.log('Test send response:', response);

      if (response.success) {
        toast({ title: 'Test email sent', description: `Test email sent to ${testEmail}` });
        setIsTestSendOpen(false);
        setTestEmail('');
        setSelectedTemplate(null);
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to send test email',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      preheader: template.preheader || '',
      from_name: template.from_name,
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
