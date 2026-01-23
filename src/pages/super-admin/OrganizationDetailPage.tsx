import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Organization } from '@/types';
import { ArrowLeft, Users, Calendar, Building2, Pencil, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrganization();
  }, [id]);

  const fetchOrganization = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data
    setOrganization({
      id: id || '1',
      name: 'Acme Real Estate',
      is_active: true,
      created_at: '2024-01-15T10:00:00Z',
      agent_count: 12,
    });
    setIsLoading(false);
  };

  const handleToggleActive = async () => {
    if (!organization) return;
    await new Promise(resolve => setTimeout(resolve, 300));
    const newStatus = !organization.is_active;
    setOrganization({ ...organization, is_active: newStatus });
    toast({
      title: newStatus ? 'Organization activated' : 'Organization deactivated',
      description: `${organization.name} has been ${newStatus ? 'activated' : 'deactivated'}.`,
    });
  };

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Organization not found</h2>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/sa/organizations')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Organizations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/sa/organizations')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Organizations
        </Button>
      </div>

      <PageHeader
        title={organization.name}
        description="Organization details and management"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleToggleActive}>
              {organization.is_active ? (
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
            </Button>
            <Button onClick={() => navigate(`/sa/organizations/${id}/agents`)}>
              <Users className="w-4 h-4 mr-2" />
              Manage Agents
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <StatusBadge variant={organization.is_active ? 'active' : 'inactive'}>
              {organization.is_active ? 'Active' : 'Inactive'}
            </StatusBadge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization.agent_count || 0}</div>
            <p className="text-xs text-muted-foreground">Total agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(organization.created_at).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">Registration date</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
