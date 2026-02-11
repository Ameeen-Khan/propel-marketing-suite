import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Notification, NotificationType } from '@/types';
import { Bell, CheckCheck, Info, AlertCircle, CheckCircle, AlertTriangle, Loader2, Send, Upload, UserPlus, XCircle } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { notificationsApi } from '@/services/api';


const typeIcons: Record<NotificationType, React.ReactNode> = {
  campaign_sent: <Send className="w-5 h-5 text-success" />,
  csv_import_completed: <Upload className="w-5 h-5 text-success" />,
  csv_import_failed: <XCircle className="w-5 h-5 text-destructive" />,
  agent_added: <UserPlus className="w-5 h-5 text-primary" />,
  info: <Info className="w-5 h-5 text-primary" />,
  success: <CheckCircle className="w-5 h-5 text-success" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning" />,
  error: <AlertCircle className="w-5 h-5 text-destructive" />,
};

export function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await notificationsApi.list({ page: 1, limit: 100 });
      console.log('NotificationsPage - Response:', response);

      if (response && response.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const responseData = response.data as any;
        const notificationsData = responseData.notifications || responseData.data || (Array.isArray(responseData) ? responseData : []);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const normalized = notificationsData.map((n: any) => ({
          ...n,
          id: n.id || n.ID,
          title: n.title || n.Title,
          message: n.message || n.Message,
          notification_type: (n.notification_type || n.NotificationType || 'info').toLowerCase(),
          is_read: n.is_read !== undefined ? n.is_read : (n.IsRead !== undefined ? n.IsRead : false),
          created_at: n.created_at || n.CreatedAt || new Date().toISOString(),
        }));

        setNotifications(normalized);
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to load notifications',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive'
      });
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await notificationsApi.markRead(id);
      if (response.success) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);

      // Mark each unread notification individually
      await Promise.all(
        unreadNotifications.map(notification =>
          notificationsApi.markRead(notification.id)
        )
      );

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast({ title: 'All notifications marked as read' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
        variant: 'destructive'
      });
    } finally {
      setIsMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
  };

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `You have ${unreadCount} unread notification(s)` : 'All caught up!'}
        actions={
          unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead} disabled={isMarkingAll}>
              {isMarkingAll ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4 mr-2" />
              )}
              Mark all as read
            </Button>
          )
        }
      />

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No notifications</h3>
            <p className="text-muted-foreground text-sm">
              You're all caught up! Check back later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "cursor-pointer transition-colors hover:bg-muted/50",
                !notification.is_read && "bg-primary/5 border-primary/20"
              )}
              onClick={() => handleMarkAsRead(notification.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">
                    {typeIcons[notification.notification_type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className={cn(
                          "text-sm",
                          !notification.is_read && "font-semibold"
                        )}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
