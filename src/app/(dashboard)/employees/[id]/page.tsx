'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { ArrowLeft, Pencil, Save } from 'lucide-react';
import { getInitials, formatDate, formatCurrency, maskSIN } from '@/lib/utils';
import type { Employee, LeaveRequest, Profile } from '@/types/database';
import { LEAVE_TYPE_CONFIG } from '@/types/database';

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Employee>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadEmployee();
  }, [id]);

  async function loadEmployee() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(prof);

    const { data: emp } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();
    setEmployee(emp);

    if (emp) {
      const { data: leaves } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', emp.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setLeaveHistory(leaves ?? []);
    }

    setLoading(false);
  }

  function startEdit() {
    if (!employee) return;
    setEditForm({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone,
      job_title: employee.job_title,
      department: employee.department,
      employment_type: employee.employment_type,
      salary: employee.salary,
      vacation_days_entitled: employee.vacation_days_entitled,
      sick_days_entitled: employee.sick_days_entitled,
    });
    setEditing(true);
  }

  async function handleSave() {
    if (!employee) return;
    setSaving(true);

    await supabase
      .from('employees')
      .update(editForm)
      .eq('id', employee.id);

    setEditing(false);
    setSaving(false);
    loadEmployee();
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--spinner-track)] border-t-[var(--spinner-fill)]" /></div>;
  }

  if (!employee) {
    return <p className="py-20 text-center text-[var(--text-tertiary)]">Employee not found.</p>;
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {employee.first_name} {employee.last_name}
          </h1>
          <p className="text-sm text-[var(--text-tertiary)]">
            {employee.job_title} &middot; {employee.department}
          </p>
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={startEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent>
            <div className="flex flex-col items-center py-4">
              <Avatar initials={getInitials(employee.first_name, employee.last_name)} size="lg" />
              <h2 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">
                {employee.first_name} {employee.last_name}
              </h2>
              <p className="text-sm text-[var(--text-tertiary)]">{employee.job_title}</p>
              <div className="mt-2 flex gap-2">
                <Badge variant="info">{employee.department}</Badge>
                <Badge variant="default">{employee.employment_type.replace('_', '-')}</Badge>
              </div>
            </div>
            <div className="mt-2 space-y-3 border-t border-[var(--border)] pt-4 text-sm">
              <InfoRow label="Email" value={employee.email} />
              <InfoRow label="Phone" value={employee.phone || 'Not set'} />
              <InfoRow label="Start Date" value={formatDate(employee.start_date)} />
              {isAdmin && <InfoRow label="Salary" value={formatCurrency(employee.salary)} />}
              {isAdmin && <InfoRow label="SIN" value={maskSIN(employee.sin_encrypted)} />}
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Leave Balances */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-[var(--text-primary)]">Leave Balances</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-[var(--blue-bg)] p-4">
                  <p className="text-sm text-[var(--blue-text)]">Vacation</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--blue-text)]">
                    {employee.vacation_days_remaining}
                  </p>
                  <p className="text-xs text-[var(--blue-text-muted)]">of {employee.vacation_days_entitled} days</p>
                </div>
                <div className="rounded-lg bg-[var(--red-bg)] p-4">
                  <p className="text-sm text-[var(--red-text)]">Sick Days</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--red-text)]">
                    {employee.sick_days_remaining}
                  </p>
                  <p className="text-xs text-[var(--red-text-muted)]">of {employee.sick_days_entitled} days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Leave */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-[var(--text-primary)]">Recent Leave Requests</h3>
            </CardHeader>
            <CardContent>
              {leaveHistory.length === 0 ? (
                <p className="py-4 text-center text-sm text-[var(--text-tertiary)]">No leave requests.</p>
              ) : (
                <div className="space-y-2">
                  {leaveHistory.map(req => (
                    <div key={req.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
                      <div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {LEAVE_TYPE_CONFIG[req.leave_type]?.label}
                        </span>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {formatDate(req.start_date)} &ndash; {formatDate(req.end_date)}
                        </p>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Address & Emergency */}
          {isAdmin && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader><h3 className="font-semibold text-[var(--text-primary)]">Address</h3></CardHeader>
                <CardContent className="text-sm text-[var(--text-secondary)]">
                  <p>{employee.address_street || 'Not set'}</p>
                  <p>{employee.address_city}{employee.address_province ? `, ${employee.address_province}` : ''}</p>
                  <p>{employee.address_postal_code}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><h3 className="font-semibold text-[var(--text-primary)]">Emergency Contact</h3></CardHeader>
                <CardContent className="text-sm text-[var(--text-secondary)] space-y-1">
                  <p className="font-medium text-[var(--text-primary)]">{employee.emergency_contact_name || 'Not set'}</p>
                  <p>{employee.emergency_contact_relationship}</p>
                  <p>{employee.emergency_contact_phone}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Employee" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={editForm.first_name ?? ''}
              onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))}
            />
            <Input
              label="Last Name"
              value={editForm.last_name ?? ''}
              onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))}
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={editForm.email ?? ''}
            onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone"
              value={editForm.phone ?? ''}
              onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
            />
            <Input
              label="Job Title"
              value={editForm.job_title ?? ''}
              onChange={e => setEditForm(f => ({ ...f, job_title: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Department"
              value={editForm.department ?? ''}
              onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
            />
            <Select
              label="Employment Type"
              value={editForm.employment_type ?? 'full_time'}
              onChange={e => setEditForm(f => ({ ...f, employment_type: e.target.value as Employee['employment_type'] }))}
              options={[
                { value: 'full_time', label: 'Full-Time' },
                { value: 'part_time', label: 'Part-Time' },
                { value: 'contract', label: 'Contract' },
                { value: 'intern', label: 'Intern' },
              ]}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Salary"
              type="number"
              value={String(editForm.salary ?? '')}
              onChange={e => setEditForm(f => ({ ...f, salary: Number(e.target.value) }))}
            />
            <Input
              label="Vacation Entitlement"
              type="number"
              value={String(editForm.vacation_days_entitled ?? '')}
              onChange={e => setEditForm(f => ({ ...f, vacation_days_entitled: Number(e.target.value) }))}
            />
            <Input
              label="Sick Day Entitlement"
              type="number"
              value={String(editForm.sick_days_entitled ?? '')}
              onChange={e => setEditForm(f => ({ ...f, sick_days_entitled: Number(e.target.value) }))}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--text-tertiary)]">{label}</span>
      <span className="font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}
