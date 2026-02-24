'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Users,
  Clock,
  Sun,
  Heart,
  CalendarDays,
  Bell,
} from 'lucide-react';
import { getGreeting, formatDate, formatDateShort, getInitials } from '@/lib/utils';
import type { Profile, Employee, LeaveRequest } from '@/types/database';
import { LEAVE_TYPE_CONFIG } from '@/types/database';
import Link from 'next/link';

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [pendingLeave, setPendingLeave] = useState<(LeaveRequest & { employee?: Employee })[]>([]);
  const [upcomingLeave, setUpcomingLeave] = useState<LeaveRequest[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load profile
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (!prof) return;
    setProfile(prof);

    // Load employee
    if (prof.employee_id) {
      const { data: emp } = await supabase
        .from('employees')
        .select('*')
        .eq('id', prof.employee_id)
        .single();
      if (emp) setEmployee(emp);

      // Load upcoming approved leave
      const { data: upcoming } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', prof.employee_id)
        .in('status', ['approved', 'auto_approved'])
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date')
        .limit(5);
      if (upcoming) setUpcomingLeave(upcoming);
    }

    // Admin / manager stats
    if (prof.role === 'admin' || prof.role === 'manager') {
      const { count } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .is('termination_date', null);
      setTotalEmployees(count ?? 0);

      const { data: pendingData, count: pCount } = await supabase
        .from('leave_requests')
        .select('*, employee:employees(*)', { count: 'exact' })
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      setPendingLeave(pendingData ?? []);
      setPendingCount(pCount ?? 0);
    }
  }

  if (!profile) return null;

  const greeting = employee
    ? `${getGreeting()}, ${employee.first_name}`
    : getGreeting();

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center gap-4">
        {employee && (
          <Avatar initials={getInitials(employee.first_name, employee.last_name)} size="lg" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{greeting}</h1>
          {employee && (
            <p className="text-sm text-[var(--text-tertiary)]">{employee.job_title} &middot; {employee.department}</p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(profile.role === 'admin' || profile.role === 'manager') && (
          <>
            <StatCard title="Active Employees" value={totalEmployees} icon={Users} color="teal" />
            <StatCard title="Pending Requests" value={pendingCount} icon={Clock} color="amber" />
          </>
        )}
        {employee && (
          <>
            <StatCard
              title="Vacation Days"
              value={`${employee.vacation_days_remaining} / ${employee.vacation_days_entitled}`}
              icon={Sun}
              color="blue"
            />
            <StatCard
              title="Sick Days"
              value={`${employee.sick_days_remaining} / ${employee.sick_days_entitled}`}
              icon={Heart}
              color="red"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leave Balances */}
        {employee && (
          <Card>
            <CardContent>
              <h3 className="mb-4 font-semibold text-[var(--text-primary)]">Leave Balances</h3>
              <div className="space-y-4">
                <BalanceBar
                  label="Vacation"
                  used={employee.vacation_days_entitled - employee.vacation_days_remaining}
                  total={employee.vacation_days_entitled}
                  color="bg-[var(--color-info-text)]"
                />
                <BalanceBar
                  label="Sick"
                  used={employee.sick_days_entitled - employee.sick_days_remaining}
                  total={employee.sick_days_entitled}
                  color="bg-[var(--color-danger-text)]"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Time Off */}
        {upcomingLeave.length > 0 && (
          <Card>
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-[var(--text-primary)]">Upcoming Time Off</h3>
                <Link href="/leave" className="text-sm text-[var(--accent-light)] hover:text-[var(--accent)]">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {upcomingLeave.map(req => (
                  <div key={req.id} className="flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 text-[var(--text-muted)]" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {LEAVE_TYPE_CONFIG[req.leave_type]?.label}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {formatDateShort(req.start_date)} &ndash; {formatDateShort(req.end_date)}
                      </p>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pending Approvals for managers/admin */}
      {(profile.role === 'admin' || profile.role === 'manager') && pendingLeave.length > 0 && (
        <Card>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[var(--color-warning-text)]" />
                <h3 className="font-semibold text-[var(--text-primary)]">Pending Approvals</h3>
                <span className="rounded-full bg-[var(--color-warning-bg)] px-2 py-0.5 text-xs font-medium text-[var(--color-warning-text)]">
                  {pendingCount}
                </span>
              </div>
              <Link href="/leave/approvals" className="text-sm text-[var(--accent-light)] hover:text-[var(--accent)]">
                Review all
              </Link>
            </div>
            <div className="space-y-3">
              {pendingLeave.map(req => (
                <div key={req.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3">
                  {req.employee && (
                    <Avatar
                      initials={getInitials(req.employee.first_name, req.employee.last_name)}
                      size="sm"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {req.employee ? `${req.employee.first_name} ${req.employee.last_name}` : 'Unknown'}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {LEAVE_TYPE_CONFIG[req.leave_type]?.label} &middot;{' '}
                      {formatDateShort(req.start_date)} &ndash; {formatDateShort(req.end_date)}
                    </p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BalanceBar({ label, used, total, color }: {
  label: string;
  used: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const remaining = Math.max(total - used, 0);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-[var(--text-secondary)]">{label}</span>
        <span className="text-[var(--text-tertiary)]">
          {remaining} of {total} remaining
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-surface-hover)]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
