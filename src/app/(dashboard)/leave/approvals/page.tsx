'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { CheckSquare, Check, X } from 'lucide-react';
import { formatDate, getInitials, calculateBusinessDays } from '@/lib/utils';
import type { LeaveRequest, Employee } from '@/types/database';
import { LEAVE_TYPE_CONFIG } from '@/types/database';

interface LeaveWithEmployee extends LeaveRequest {
  employee: Employee;
}

export default function ApprovalsPage() {
  const [pending, setPending] = useState<LeaveWithEmployee[]>([]);
  const [history, setHistory] = useState<LeaveWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadApprovals();
  }, []);

  async function loadApprovals() {
    // Pending requests
    const { data: pendingData } = await supabase
      .from('leave_requests')
      .select('*, employee:employees(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    setPending((pendingData ?? []) as LeaveWithEmployee[]);

    // Recent reviewed requests (last 30)
    const { data: historyData } = await supabase
      .from('leave_requests')
      .select('*, employee:employees(*)')
      .in('status', ['approved', 'denied'])
      .order('reviewed_at', { ascending: false })
      .limit(30);
    setHistory((historyData ?? []) as LeaveWithEmployee[]);

    setLoading(false);
  }

  async function handleApprove(request: LeaveWithEmployee) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const note = reviewNotes[request.id] || '';

    await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_note: note || null,
      })
      .eq('id', request.id);

    // Deduct leave balance
    const days = calculateBusinessDays(
      new Date(request.start_date),
      new Date(request.end_date)
    );

    if (request.leave_type === 'vacation') {
      await supabase
        .from('employees')
        .update({
          vacation_days_remaining: request.employee.vacation_days_remaining - days,
        })
        .eq('id', request.employee_id);
    } else if (request.leave_type === 'sick') {
      await supabase
        .from('employees')
        .update({
          sick_days_remaining: request.employee.sick_days_remaining - days,
        })
        .eq('id', request.employee_id);
    }

    setExpandedId(null);
    loadApprovals();
  }

  async function handleDeny(request: LeaveWithEmployee) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const note = reviewNotes[request.id] || '';

    await supabase
      .from('leave_requests')
      .update({
        status: 'denied',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_note: note || null,
      })
      .eq('id', request.id);

    setExpandedId(null);
    loadApprovals();
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--spinner-track)] border-t-[var(--spinner-fill)]" /></div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Leave Approvals</h1>

      {/* Pending */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
          Pending Requests
          {pending.length > 0 && (
            <span className="ml-2 rounded-full bg-[var(--color-warning-bg)] px-2 py-0.5 text-sm font-medium text-[var(--color-warning-text)]">
              {pending.length}
            </span>
          )}
        </h2>

        {pending.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="All caught up!"
            description="No pending leave requests to review."
          />
        ) : (
          <div className="space-y-3">
            {pending.map(req => {
              const days = calculateBusinessDays(new Date(req.start_date), new Date(req.end_date));
              const isExpanded = expandedId === req.id;

              return (
                <Card key={req.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <Avatar
                        initials={getInitials(req.employee.first_name, req.employee.last_name)}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-[var(--text-primary)]">
                            {req.employee.first_name} {req.employee.last_name}
                          </span>
                          <StatusBadge status={req.status} />
                        </div>
                        <p className="mt-0.5 text-sm text-[var(--text-tertiary)]">
                          {LEAVE_TYPE_CONFIG[req.leave_type]?.label} &middot;{' '}
                          {formatDate(req.start_date)} &ndash; {formatDate(req.end_date)}
                          <span className="ml-2 font-medium text-[var(--text-secondary)]">{days} day(s)</span>
                        </p>
                        {req.reason && (
                          <p className="mt-1 text-sm text-[var(--text-secondary)]">{req.reason}</p>
                        )}

                        {isExpanded ? (
                          <div className="mt-3 space-y-3">
                            <Input
                              placeholder="Add a note (optional)..."
                              value={reviewNotes[req.id] ?? ''}
                              onChange={e =>
                                setReviewNotes(prev => ({ ...prev, [req.id]: e.target.value }))
                              }
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(req)}
                              >
                                <Check className="h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDeny(req)}
                              >
                                <X className="h-4 w-4" />
                                Deny
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setExpandedId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="mt-2 text-sm font-medium text-[var(--accent-light)] hover:text-[var(--accent)]"
                            onClick={() => setExpandedId(req.id)}
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* History */}
      {history.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Recent Decisions</h2>
          <div className="space-y-2">
            {history.map(req => (
              <Card key={req.id}>
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      initials={getInitials(req.employee.first_name, req.employee.last_name)}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {req.employee.first_name} {req.employee.last_name}
                      </span>
                      <span className="ml-2 text-sm text-[var(--text-tertiary)]">
                        {LEAVE_TYPE_CONFIG[req.leave_type]?.label} &middot;{' '}
                        {formatDate(req.start_date)} &ndash; {formatDate(req.end_date)}
                      </span>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
