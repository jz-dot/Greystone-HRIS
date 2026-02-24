import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'emerald' | 'blue' | 'red' | 'amber' | 'teal' | 'purple';
}

const colorMap = {
  emerald: { bg: 'bg-[var(--color-success-bg)]', icon: 'text-[var(--color-success-text)]' },
  blue: { bg: 'bg-[var(--color-info-bg)]', icon: 'text-[var(--color-info-text)]' },
  red: { bg: 'bg-[var(--color-danger-bg)]', icon: 'text-[var(--color-danger-text)]' },
  amber: { bg: 'bg-[var(--color-warning-bg)]', icon: 'text-[var(--color-warning-text)]' },
  teal: { bg: 'bg-[var(--color-success-bg)]', icon: 'text-[var(--color-success-text)]' },
  purple: { bg: 'bg-[var(--color-info-bg)]', icon: 'text-[var(--color-info-text)]' },
};

export function StatCard({ title, value, icon: Icon, color = 'emerald' }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 transition-colors hover:border-[var(--border-hover)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-tertiary)]">{title}</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{value}</p>
        </div>
        <div className={cn('rounded-lg p-2', c.bg)}>
          <Icon className={cn('h-5 w-5', c.icon)} />
        </div>
      </div>
    </div>
  );
}
