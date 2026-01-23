import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Notification, NotificationType } from '@/types';
import { Bell, CheckCheck, Info, AlertCircle, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data
const mockNotifications: Notification[] = [
  { id: '1', title: 'Campaign completed', message: 'Your "Welcome Series" campaign has finished sending.', notification_type: 'success', is_read: false, created_at: '2024-04-20T10:30:00Z' },
  { id: '2', title: 'CSV import complete', message: '150 contacts have been successfully imported.', notification_type: 'success', is_read: false, created_at: '2024-04-20T09:15:00Z' },
  { id: '3', title: 'Campaign paused', message: 'Your "Weekly Newsletter" campaign has been paused due to low engagement.', notification_type: 'warning', is_read: false, created_at: '2024-04-19T16:45:00Z' },
  { id: '4', title: 'New agent joined', message: 'Sarah Johnson has accepted the invitation and joined your organization.', notification_type: 'info', is_read: true, created_at: '2024-04-19T14:20:00Z' },
  { id: '5', title: 'Email delivery failed', message: '5 emails from your "New Listing Alert" campaign bounced.', notification_type: 'error', is_read: true, created_at: '2024-04-18T11:00:00Z' },
  { id: '6', title: 'Template updated', message: 'Your "Monthly Newsletter" template has been updated.', notification_type: 'info', is_read: true, created_at: '2024-04-17T09:30:00Z' },
];

const typeIcons: Record<NotificationType, React.ReactNode> = {
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
    await new Promise(resolve => setTimeout(resolve, 500));
    setNotifications(mockNotifications);
    setIsLoading(false);
  };

  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast({ title: 'All notifications marked as read' });
    setIsMarkingAll(false);
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
    return date.toLocaleDateString();
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
