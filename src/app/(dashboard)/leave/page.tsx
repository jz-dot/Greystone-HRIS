'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input, Select, Textarea } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { CalendarDays, Plus, Zap } from 'lucide-react';
import { formatDate, calculateBusinessDays } from '@/lib/utils';
import type { Profile, LeaveRequest, LeaveType, CompanySettings } from '@/types/database';
import { LEAVE_TYPE_CONFIG } from '@/types/database';

const leaveTypeOptions = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'sick', label: 'Sick Day' },
  { value: 'personal', label: 'Personal' },
  { value: 'bereavement', label: 'Bereavement' },
  { value: 'parental', label: 'Parental' },
  { value: 'unpaid', label: 'Unpaid' },
];

const statusFilterOptions = [
  { value: 'all', label: 'All Requests' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'auto_approved', label: 'Auto-Approved' },
  { value: 'denied', label: 'Denied' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function LeavePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [leaveType, setLeaveType] = useState<LeaveType>('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (!prof?.employee_id) return;
    setProfile(prof);

    const { data: reqs } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', prof.employee_id)
      .order('created_at', { ascending: false });
    setRequests(reqs ?? []);

    const { data: s } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .single();
    setSettings(s);

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!profile?.employee_id || !startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      setError('End date must be on or after start date.');
      return;
    }

    setSubmitting(true);
    const days = calculateBusinessDays(start, end);

    // Check if auto-approvable
    const config = LEAVE_TYPE_CONFIG[leaveType];
    const threshold = leaveType === 'sick'
      ? (settings?.auto_approve_sick_threshold ?? 3)
      : leaveType === 'personal'
        ? (settings?.auto_approve_personal_threshold ?? 1)
        : 0;

    const autoApprove = settings?.auto_approve_enabled && config.autoApprovable && days <= threshold;

    const { error: insertError } = await supabase
      .from('leave_requests')
      .insert({
        employee_id: profile.employee_id,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason,
        status: autoApprove ? 'auto_approved' : 'pending',
        is_auto_approved: autoApprove ?? false,
        reviewed_at: autoApprove ? new Date().toISOString() : null,
      });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    // Deduct balance if auto-approved
    if (autoApprove) {
      if (leaveType === 'sick') {
        await supabase.rpc('deduct_sick_days', { emp_id: profile.employee_id, days });
      } else if (leaveType === 'vacation') {
        await supabase.rpc('deduct_vacation_days', { emp_id: profile.employee_id, days });
      }
    }

    setSuccess(
      autoApprove
        ? `Your ${leaveType} request for ${days} day(s) has been automatically approved!`
        : `Your ${leaveType} request for ${days} day(s) has been submitted for review.`
    );
    setShowModal(false);
    resetForm();
    loadData();
    setSubmitting(false);
  }

  async function handleCancel(request: LeaveRequest) {
    if (!confirm('Cancel this leave request?')) return;

    await supabase
      .from('leave_requests')
      .update({ status: 'cancelled' })
      .eq('id', request.id);

    loadData();
  }

  function resetForm() {
    setLeaveType('vacation');
    setStartDate('');
    setEndDate('');
    setReason('');
  }

  const filtered = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter);

  const businessDays = startDate && endDate
    ? calculateBusinessDays(new Date(startDate), new Date(endDate))
    : 0;

  const selectedConfig = LEAVE_TYPE_CONFIG[leaveType];
  const threshold = leaveType === 'sick'
    ? (settings?.auto_approve_sick_threshold ?? 3)
    : leaveType === 'personal'
      ? (settings?.auto_approve_personal_threshold ?? 1)
      : 0;
  const willAutoApprove = settings?.auto_approve_enabled && selectedConfig.autoApprovable && businessDays > 0 && businessDays <= threshold;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--spinner-track)] border-t-[var(--spinner-fill)]" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Time Off</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Request Time Off
        </Button>
      </div>

      {/* Success message */}
      {success && (
        <div className="rounded-lg bg-[var(--color-success-bg)] px-4 py-3 text-sm text-[var(--color-success-text)]">
          {success}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusFilterOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === opt.value
                ? 'bg-[var(--pill-active-bg)] text-[var(--pill-active-text)]'
                : 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-hover)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Requests list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No leave requests"
          description="You haven't made any leave requests yet. Click the button above to request time off."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <Card key={req.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--text-primary)]">
                        {LEAVE_TYPE_CONFIG[req.leave_type]?.label}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                      {formatDate(req.start_date)} &ndash; {formatDate(req.end_date)}
                    </p>
                    {req.reason && (
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{req.reason}</p>
                    )}
                    {req.review_note && (
                      <p className="mt-1 text-sm italic text-[var(--text-tertiary)]">
                        Note: {req.review_note}
                      </p>
                    )}
                  </div>
                  {(req.status === 'pending' || req.status === 'approved' || req.status === 'auto_approved') && (
                    <button
                      onClick={() => handleCancel(req)}
                      className="text-sm text-[var(--color-danger-text)] hover:opacity-80"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Request Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); resetForm(); }} title="Request Time Off">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Leave Type"
            options={leaveTypeOptions}
            value={leaveType}
            onChange={e => setLeaveType(e.target.value as LeaveType)}
          />

          {selectedConfig.autoApprovable && settings?.auto_approve_enabled && (
            <div className="flex items-center gap-2 rounded-lg bg-[var(--color-success-bg)] px-3 py-2 text-sm text-[var(--color-success-text)]">
              <Zap className="h-4 w-4" />
              Up to {threshold} day(s) auto-approved
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              min={startDate}
              required
            />
          </div>

          {businessDays > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-[var(--bg-surface)] px-3 py-2 text-sm">
              <span className="text-[var(--text-secondary)]">Business days</span>
              <span className="font-semibold text-[var(--text-primary)]">{businessDays}</span>
            </div>
          )}

          {willAutoApprove && (
            <div className="flex items-center gap-2 rounded-lg bg-[var(--color-success-bg)] px-3 py-2 text-sm text-[var(--color-success-text)]">
              <Zap className="h-4 w-4" />
              This request will be automatically approved
            </div>
          )}

          <Textarea
            label="Reason (optional)"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Brief description..."
            rows={3}
          />

          {error && (
            <div className="rounded-lg bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger-text)]">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
