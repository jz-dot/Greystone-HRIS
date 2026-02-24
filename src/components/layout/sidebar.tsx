'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CheckSquare,
  UserPlus,
  Building2,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/components/theme-provider';
import type { UserRole } from '@/types/database';

interface SidebarProps {
  role: UserRole;
  userName: string;
  onLogout: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
  { label: 'My Time Off', href: '/leave', icon: CalendarDays, roles: ['admin', 'manager', 'employee'] },
  { label: 'Approvals', href: '/leave/approvals', icon: CheckSquare, roles: ['admin', 'manager'] },
  { label: 'Employees', href: '/employees', icon: Users, roles: ['admin', 'manager'] },
  { label: 'My Profile', href: '/profile', icon: Users, roles: ['employee'] },
  { label: 'Invite Users', href: '/admin/invitations', icon: UserPlus, roles: ['admin'] },
  { label: 'Company Settings', href: '/admin/settings', icon: Building2, roles: ['admin'] },
];

export function Sidebar({ role, userName, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const filteredItems = navItems.filter(item => item.roles.includes(role));

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#10b981] to-[#06b6d4]">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="text-[15px] font-bold text-[var(--text-primary)] tracking-tight">Greystone</h1>
          <p className="text-[11px] text-[var(--text-muted)]">HRIS</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredItems.map(item => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)]'
                  : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)]'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle + User / Logout */}
      <div className="border-t border-[var(--border)] px-4 py-4 space-y-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-tertiary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--sidebar-avatar-bg)] text-sm font-bold text-[var(--sidebar-avatar-text)]">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">{userName}</p>
            <p className="text-xs capitalize text-[var(--text-muted)]">{role}</p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)] transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed left-4 top-4 z-50 rounded-lg border border-[var(--border)] bg-[var(--mobile-btn-bg)] p-2 text-[var(--text-secondary)] shadow-lg lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - mobile */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r border-[var(--border)] bg-[var(--sidebar-bg)] transition-transform lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar - desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex h-full flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)]">
          {sidebarContent}
        </div>
      </aside>
    </>
  );
}
