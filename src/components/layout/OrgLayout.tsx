import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Mail,
  Megaphone,
  Target,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  UserCog,
  Home,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { notificationsApi } from '@/services/api';

const baseNavigation = [
  { name: 'Contacts', href: '/app/contacts', icon: Users },
  { name: 'Audiences', href: '/app/audiences', icon: Target },
  { name: 'Templates', href: '/app/templates', icon: Mail },
  { name: 'Campaigns', href: '/app/campaigns', icon: Megaphone },
];

const adminOnlyNavigation = [
  { name: 'Agents', href: '/app/agents', icon: UserCog },
];

export function OrgLayout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const isAdmin = hasRole('org_admin');
  const navigation = isAdmin
    ? [...baseNavigation, ...adminOnlyNavigation]
    : baseNavigation;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // State for real notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications? Or just once on mount. 
    // For now, once on mount + on navigation.
  }, []);

  const fetchNotifications = async () => {
    try {
      // Get latest 5
      const response = await notificationsApi.list({ page: 1, limit: 5 });
      if (response && response.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const responseData = response.data as any;
        const data = responseData.notifications || responseData.data || (Array.isArray(responseData) ? responseData : []);

        // Normalize
        const normalized = data.map((n: any) => ({
          id: n.id || n.ID,
          title: n.title || n.Title,
          message: n.message || n.Message,
          is_read: n.is_read !== undefined ? n.is_read : (n.IsRead !== undefined ? n.IsRead : false),
          created_at: (n.created_at || n.CreatedAt || new Date().toISOString()).replace(/Z$/, ''),
        }));

        setNotifications(normalized);

        // Calculate unread count globally or fetch specific unread count endpoint if available
        // For now, filter local list (approximation) or check if response has 'total_unread'
        const unread = normalized.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (e) {
      console.error('Failed to fetch notifications in layout', e);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      // Update local state optimistic
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };


  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-org-sidebar border-r border-org-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Org name */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-org-sidebar-border">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Propel" className="w-13 h-12 object-contain" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                  {user?.organization_name}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>


          {/* Navigation */}
          <motion.nav
            className="flex-1 p-4 space-y-1"
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
            {navigation.map((item, index) => (
              <motion.div
                key={item.name}
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0 }
                }}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.15 }}
              >
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "org-nav-item",
                      isActive ? "org-nav-item-active" : "org-nav-item-inactive"
                    )
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </NavLink>
              </motion.div>
            ))}
          </motion.nav>

          {/* User menu */}
          <div className="p-4 border-t border-org-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-accent transition-colors text-left">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-foreground">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {isAdmin ? 'Admin' : 'User'}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-4 lg:px-6 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          {/* Notifications */}
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Notifications</h3>
                <Button variant="ghost" size="sm" className="text-xs" onClick={handleMarkAllRead}>
                  Mark all read
                </Button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No notifications
                  </div>
                ) : (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.05
                        }
                      }
                    }}
                  >
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        variants={{
                          hidden: { opacity: 0, x: -10 },
                          visible: { opacity: 1, x: 0 }
                        }}
                        className={cn(
                          "p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors",
                          !notification.is_read && "bg-primary/5"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-2 h-2 mt-2 rounded-full flex-shrink-0",
                              notification.is_read ? "bg-muted-foreground/30" : "bg-primary"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTime(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    setNotificationsOpen(false);
                    navigate('/app/notifications');
                  }}
                >
                  View all notifications
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
