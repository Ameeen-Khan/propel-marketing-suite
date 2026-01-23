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
import { useToast } from '@/hooks/use-toast';
import { Preference } from '@/types';
import { Plus, Loader2 } from 'lucide-react';
import { z } from 'zod';

const preferenceSchema = z.object({
  name: z.string().min(1, 'Preference name is required').max(50),
});

// Mock data - includes both seeded and custom preferences
const mockPreferences: Preference[] = [
  { id: '1', name: 'Pool', created_at: '2024-01-01' },
  { id: '2', name: 'Garden', created_at: '2024-01-01' },
  { id: '3', name: 'Garage', created_at: '2024-01-01' },
  { id: '4', name: 'Gym', created_at: '2024-01-01' },
  { id: '5', name: 'Parking', created_at: '2024-01-01' },
  { id: '6', name: 'Balcony', created_at: '2024-01-01' },
  { id: '7', name: 'View', created_at: '2024-01-01' },
  { id: '8', name: 'Fireplace', created_at: '2024-01-01' },
  { id: '9', name: 'Smart Home', created_at: '2024-02-15' },
  { id: '10', name: 'Pet Friendly', created_at: '2024-03-01' },
];

export function PreferencesPage() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formName, setFormName] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, [page, limit, search]);

  const fetchPreferences = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filtered = [...mockPreferences];
    if (search) {
      filtered = filtered.filter(pref =>
        pref.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setTotal(filtered.length);
    setPreferences(filtered.slice((page - 1) * limit, page * limit));
    setIsLoading(false);
  };

  const handleCreate = async () => {
    setFormError('');
    const result = preferenceSchema.safeParse({ name: formName });
    if (!result.success) {
      setFormError(result.error.errors[0].message);
      return;
    }

    // Check for duplicate
    if (mockPreferences.some(p => p.name.toLowerCase() === formName.toLowerCase())) {
      setFormError('This preference already exists');
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({ title: 'Preference created', description: `${formName} has been added.` });
    setIsCreateOpen(false);
    setFormName('');
    fetchPreferences();
    setIsSubmitting(false);
  };

  const columns: Column<Preference>[] = [
    {
      key: 'name',
      header: 'Preference Name',
      cell: (pref) => <span className="font-medium">{pref.name}</span>,
    },
    {
      key: 'created_at',
      header: 'Created',
      cell: (pref) => (
        <span className="text-muted-foreground">
          {new Date(pref.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Preferences"
        description="Manage property preferences for contact filtering"
        actions={
          <Button onClick={() => { setFormName(''); setFormError(''); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Preference
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={preferences}
        total={total}
        page={page}
        limit={limit}
        totalPages={Math.ceil(total / limit)}
        onPageChange={setPage}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
        onSearch={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Search preferences..."
        isLoading={isLoading}
        emptyMessage="No preferences found"
      />

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Preference</DialogTitle>
            <DialogDescription>
              Add a new property preference option.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pref-name">Preference Name</Label>
              <Input
                id="pref-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Solar Panels"
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
              Add Preference
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
