'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Users, Search } from 'lucide-react';
import { getInitials, formatDate } from '@/lib/utils';
import type { Employee } from '@/types/database';
import Link from 'next/link';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('employees')
        .select('*')
        .is('termination_date', null)
        .order('last_name');
      setEmployees(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const departments = [...new Set(employees.map(e => e.department))].sort();

  const filtered = employees.filter(e => {
    const matchesSearch =
      search === '' ||
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.job_title.toLowerCase().includes(search.toLowerCase());
    const matchesDept = filterDept === 'all' || e.department === filterDept;
    return matchesSearch && matchesDept;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--spinner-track)] border-t-[var(--spinner-fill)]" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Employee Directory</h1>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] py-2 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors duration-200"
            placeholder="Search by name, email, or title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors duration-200"
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
        >
          <option value="all" className="bg-[var(--bg-tertiary)]">All Departments</option>
          {departments.map(d => (
            <option key={d} value={d} className="bg-[var(--bg-tertiary)]">{d}</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-[var(--text-tertiary)]">{filtered.length} employee(s)</p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees found"
          description="Try adjusting your search or filter."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(emp => (
            <Link key={emp.id} href={`/employees/${emp.id}`}>
              <Card className="cursor-pointer transition-all hover:border-[var(--border-hover)]">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <Avatar initials={getInitials(emp.first_name, emp.last_name)} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--text-primary)] truncate">
                        {emp.first_name} {emp.last_name}
                      </p>
                      <p className="text-sm text-[var(--text-tertiary)] truncate">{emp.job_title || 'No title'}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="info">{emp.department}</Badge>
                    <Badge variant="default">{emp.employment_type.replace('_', '-')}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    Started {formatDate(emp.start_date)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
