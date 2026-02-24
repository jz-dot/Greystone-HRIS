import { cn } from '@/lib/utils';

interface AvatarProps {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export function Avatar({ initials, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-[var(--accent-muted)] font-semibold text-[var(--accent-light)]',
        sizeStyles[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
