'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Building2,
  MapPin,
  Layers,
  Briefcase,
  Shield,
  CalendarClock,
  CalendarDays,
} from 'lucide-react';

const settingsNav = [
  { label: 'Company', href: '/admin/settings', icon: Building2 },
  { label: 'Sites', href: '/admin/settings/sites', icon: MapPin },
  { label: 'Departments', href: '/admin/settings/departments', icon: Layers },
  { label: 'Job Roles', href: '/admin/settings/job-roles', icon: Briefcase },
  { label: 'Roles & Permissions', href: '/admin/settings/roles', icon: Shield },
  { label: 'PTO Policies', href: '/admin/settings/pto', icon: CalendarClock },
  { label: 'Holidays', href: '/admin/settings/holidays', icon: CalendarDays },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>

      <div className="flex gap-6">
        {/* Sub-navigation */}
        <nav className="hidden w-52 shrink-0 md:block">
          <div className="space-y-1">
            {settingsNav.map(item => {
              const isActive =
                item.href === '/admin/settings'
                  ? pathname === '/admin/settings' || pathname === '/admin/settings/company'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)]'
                      : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)]'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Mobile nav */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 md:hidden">
          {settingsNav.map(item => {
            const isActive =
              item.href === '/admin/settings'
                ? pathname === '/admin/settings'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--pill-active-bg)] text-[var(--pill-active-text)]'
                    : 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
