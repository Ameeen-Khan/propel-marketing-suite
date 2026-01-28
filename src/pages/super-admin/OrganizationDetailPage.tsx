import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Organization } from '@/types';
import { ArrowLeft, Users, Calendar, Building2, Pencil, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { organizationsApi, agentsApi } from '@/services/api';

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
    if (!id) return;
    setIsLoading(true);
    try {
      // First try to get the organization details directly
      const response = await organizationsApi.get(id);

      let orgData: any = {};

      if (response.success && response.data) {
        orgData = response.data;
      } else {
        // Fallback logic
        console.warn('Direct GET failed, trying fallback search:', response.message);
        try {
          const listResponse = await organizationsApi.list({ page: 1, limit: 100, search: id });
          if (listResponse.success && listResponse.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const listData: any = listResponse.data;
            const orgs = listData.data || (Array.isArray(listData) ? listData : []);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const foundOrg = orgs.find((o: any) => (o.id || o.ID) === id);
            if (foundOrg) orgData = foundOrg;
          }
        } catch (e) {
          console.error('Fallback failed', e);
        }
      }

      if (orgData && (orgData.id || orgData.ID)) {
        // Normalize found org
        const normalizedOrg = {
          ...orgData,
          id: orgData.id || orgData.ID,
          name: orgData.name || orgData.Name,
          is_active: orgData.is_active !== undefined ? orgData.is_active : (orgData.IsActive !== undefined ? orgData.IsActive : false),
          created_at: orgData.created_at || orgData.CreatedAt || new Date().toISOString(),
          agent_count: orgData.agent_count || orgData.AgentCount || 0,
        };

        setOrganization(normalizedOrg);

        // Double check agent count by fetching agents list
        try {
          // We can use list api to specific org to get count
          // Note: agentsApi.list signature is (params, organizationId)
          const agentsResponse = await agentsApi.list({ page: 1, limit: 1 }, id);
          if (agentsResponse.success && agentsResponse.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const responseData = agentsResponse.data as any;

            // If total is present, use it
            const totalAgents = responseData.total !== undefined
              ? responseData.total
              : (Array.isArray(responseData) ? responseData.length : (responseData.data ? responseData.data.length : 0));

            if (typeof totalAgents === 'number') {
              setOrganization(prev => prev ? ({ ...prev, agent_count: totalAgents }) : null);
            }
          }
        } catch (e) {
          console.warn('Failed to fetch agent count', e);
        }

      } else {
        toast({
          title: 'Error',
          description: 'Failed to load organization details',
          variant: 'destructive'
        });
        navigate('/sa/organizations');
      }

    } catch (error) {
      // Also try fallback on catch to be consistent
      try {
        const listResponse = await organizationsApi.list({ page: 1, limit: 100, search: id });
        if (listResponse.success && listResponse.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const listData: any = listResponse.data;
          const orgs = listData.data || (Array.isArray(listData) ? listData : []);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const foundOrg = orgs.find((o: any) => (o.id || o.ID) === id);

          if (foundOrg) {
            // Normalize found org
            const normalizedOrg = {
              ...foundOrg,
              id: foundOrg.id || foundOrg.ID,
              name: foundOrg.name || foundOrg.Name,
              is_active: foundOrg.is_active !== undefined ? foundOrg.is_active : (foundOrg.IsActive !== undefined ? foundOrg.IsActive : false),
              created_at: foundOrg.created_at || foundOrg.CreatedAt || new Date().toISOString(),
              agent_count: foundOrg.agent_count || foundOrg.AgentCount || 0,
            };
            setOrganization(normalizedOrg);
            return;
          }
        }
      } catch (e) {
        // ignore
      }

      toast({
        title: 'Error',
        description: 'Failed to load organization details',
        variant: 'destructive'
      });
      navigate('/sa/organizations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!organization || !id) return;
    try {
      const response = organization.is_active
        ? await organizationsApi.deactivate(id)
        : await organizationsApi.activate(id);

      if (response.success) {
        const newStatus = !organization.is_active;
        setOrganization({ ...organization, is_active: newStatus });
        toast({
          title: newStatus ? 'Organization activated' : 'Organization deactivated',
          description: `${organization.name} has been ${newStatus ? 'activated' : 'deactivated'}.`,
        });
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
