import { useState, useEffect } from 'react';
import { campaignsApi } from '@/services/api';
import { CampaignLog } from '@/types';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CampaignLogsViewerProps {
    campaignId?: string;
    isOpen: boolean;
}

export function CampaignLogsViewer({ campaignId, isOpen }: CampaignLogsViewerProps) {
    const [logs, setLogs] = useState<CampaignLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen && campaignId) {
            fetchLogs();
        } else {
            setLogs([]);
            setTotal(0);
        }
    }, [isOpen, campaignId, page, limit]);

    const fetchLogs = async () => {
        if (!campaignId) return;
        setIsLoading(true);
        try {
            const response = await campaignsApi.getLogs(campaignId, {
                page,
                limit,
                sort_by: 'created_at',
                sort_order: 'desc'
            });

            if (response.success && response.data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const responseData = response.data as any;
                const logsData = responseData.logs || responseData.data || (Array.isArray(responseData) ? responseData : []);

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const normalized = logsData.map((l: any) => ({
                    id: l.id || l.ID || Math.random().toString(),
                    campaign_id: l.campaign_id || l.CampaignID,
                    recipient_email: l.recipient_email || l.RecipientEmail,
                    status: (l.status || l.Status || 'unknown').toLowerCase(),
                    error_message: l.error_message || l.ErrorMessage,
                    opened_at: l.opened_at || l.OpenedAt,
                    clicked_at: l.clicked_at || l.ClickedAt,
                    created_at: (l.created_at || l.CreatedAt || new Date().toISOString()).replace(/Z$/, ''),
                }));

                setLogs(normalized);
                setTotal(responseData.total || normalized.length || 0);
            }
        } catch (error) {
            console.error('Failed to fetch logs', error);
            toast({
                title: 'Error',
                description: 'Failed to load campaign logs',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const columns: Column<CampaignLog>[] = [
        {
            key: 'recipient',
            header: 'Recipient',
            cell: (log) => log.recipient_email,
        },
        {
            key: 'status',
            header: 'Status',
            cell: (log) => (
                <StatusBadge variant={
                    log.status === 'sent' ? 'completed' :
                        log.status === 'failed' ? 'failed' :
                            log.status === 'opened' ? 'active' :
                                log.status === 'clicked' ? 'active' : 'pending'
                }>
                    {log.status.toUpperCase()}
                </StatusBadge>
            ),
        },
        {
            key: 'details',
            header: 'Details',
            cell: (log) => log.error_message ? <span className="text-destructive text-xs">{log.error_message}</span> : '-',
        },
        {
            key: 'time',
            header: 'Time',
            cell: (log) => new Date(log.created_at).toLocaleString(),
        }
    ];

    if (!isOpen || !campaignId) return null;

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={logs}
                total={total}
                page={page}
                limit={limit}
                totalPages={Math.ceil(total / limit)}
                onPageChange={setPage}
                onLimitChange={setLimit}
                isLoading={isLoading}
                emptyMessage="No logs found for this campaign"
            />
        </div>
    );
}
