import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

const variants = {
  default: 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]',
  success: 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]',
  warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]',
  danger: 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]',
  info: 'bg-[var(--color-info-bg)] text-[var(--color-info-text)]',
  neutral: 'bg-[var(--bg-surface)] text-[var(--text-tertiary)]',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    pending: { label: 'Pending', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    auto_approved: { label: 'Auto-Approved', variant: 'success' },
    denied: { label: 'Denied', variant: 'danger' },
    cancelled: { label: 'Cancelled', variant: 'neutral' },
    accepted: { label: 'Accepted', variant: 'success' },
    expired: { label: 'Expired', variant: 'neutral' },
    revoked: { label: 'Revoked', variant: 'danger' },
  };
  const config = map[status] ?? { label: status, variant: 'default' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
