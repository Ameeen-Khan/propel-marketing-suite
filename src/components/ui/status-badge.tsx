import { cn } from "@/lib/utils";

type StatusVariant = 
  | 'active' 
  | 'inactive' 
  | 'pending' 
  | 'running' 
  | 'paused' 
  | 'completed' 
  | 'failed'
  | 'draft'
  | 'scheduled'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced';

interface StatusBadgeProps {
  variant: StatusVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  active: 'status-active',
  inactive: 'status-inactive',
  pending: 'status-pending',
  running: 'status-running',
  paused: 'status-paused',
  completed: 'status-completed',
  failed: 'status-failed',
  draft: 'status-inactive',
  scheduled: 'status-pending',
  sent: 'status-running',
  delivered: 'status-completed',
  opened: 'status-completed',
  clicked: 'status-active',
  bounced: 'status-failed',
};

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span className={cn('status-badge', variantStyles[variant], className)}>
      {children}
    </span>
  );
}
