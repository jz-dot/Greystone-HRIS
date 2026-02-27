'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, CalendarClock, Pencil, Trash2, Save } from 'lucide-react';
import type { PTOType, PTOPolicy, SystemRole } from '@/types/database';

// ─── PTO Types Section ───

const EMPTY_PTO_TYPE = {
  pto_type_code: '',
  pto_type_name: '',
  is_payable_on_termination: false,
  counts_toward_liability: false,
  is_active: true,
};

// ─── PTO Policies Section ───

const ACCRUAL_OPTIONS = [
  { value: 'accrual', label: 'Accrual (per pay period)' },
  { value: 'entitlement', label: 'Entitlement (annual grant)' },
];

const EMPTY_POLICY = {
  policy_code: '',
  policy_name: '',
  pto_type_id: '',
  applies_to_role_id: '',
  accrual_method: 'entitlement' as 'accrual' | 'entitlement',
  annual_entitlement_hours: 0,
  accrual_rate_hours_per_payperiod: 0,
  carryover_cap_hours: 0,
  balance_cap_hours: 0,
  waiting_period_days: 0,
  allow_negative_balance: false,
};

export default function PTOPoliciesPage() {
  const [ptoTypes, setPtoTypes] = useState<PTOType[]>([]);
  const [policies, setPolicies] = useState<(PTOPolicy & { pto_type?: PTOType; applies_to_role?: SystemRole })[]>([]);
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // PTO Type modal
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<PTOType | null>(null);
  const [typeForm, setTypeForm] = useState(EMPTY_PTO_TYPE);

  // Policy modal
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PTOPolicy | null>(null);
  const [policyForm, setPolicyForm] = useState(EMPTY_POLICY);

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'pto_type' | 'policy'; id: string; name: string } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient();

  const loadData = useCallback(async () => {
    const [typesRes, policiesRes, rolesRes] = await Promise.all([
      supabase.from('pto_types').select('*').order('pto_type_name'),
      supabase.from('pto_policies').select('*, pto_type:pto_types(*), applies_to_role:system_roles(*)').order('policy_name'),
      supabase.from('system_roles').select('*').eq('is_active', true).order('role_name'),
    ]);

    if (typesRes.error) showMessage('error', 'Failed to load PTO types: ' + typesRes.error.message);
    else setPtoTypes(typesRes.data ?? []);

    if (policiesRes.error) showMessage('error', 'Failed to load policies: ' + policiesRes.error.message);
    else setPolicies(policiesRes.data ?? []);

    if (!rolesRes.error) setRoles(rolesRes.data ?? []);

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  // ─── PTO Type Handlers ───

  function openAddType() {
    setEditingType(null);
    setTypeForm({ ...EMPTY_PTO_TYPE });
    setTypeModalOpen(true);
  }

  function openEditType(t: PTOType) {
    setEditingType(t);
    setTypeForm({
      pto_type_code: t.pto_type_code,
      pto_type_name: t.pto_type_name,
      is_payable_on_termination: t.is_payable_on_termination,
      counts_toward_liability: t.counts_toward_liability,
      is_active: t.is_active,
    });
    setTypeModalOpen(true);
  }

  async function handleSaveType() {
    if (!typeForm.pto_type_code.trim() || !typeForm.pto_type_name.trim()) {
      showMessage('error', 'Code and name are required.');
      return;
    }
    setSaving(true);
    const payload = {
      pto_type_code: typeForm.pto_type_code.trim().toUpperCase(),
      pto_type_name: typeForm.pto_type_name.trim(),
      is_payable_on_termination: typeForm.is_payable_on_termination,
      counts_toward_liability: typeForm.counts_toward_liability,
      is_active: typeForm.is_active,
    };

    if (editingType) {
      const { error } = await supabase.from('pto_types').update(payload).eq('id', editingType.id);
      if (error) { showMessage('error', 'Failed to update: ' + error.message); setSaving(false); return; }
      showMessage('success', 'PTO type updated.');
    } else {
      const { error } = await supabase.from('pto_types').insert(payload);
      if (error) { showMessage('error', 'Failed to create: ' + error.message); setSaving(false); return; }
      showMessage('success', 'PTO type created.');
    }
    setSaving(false);
    setTypeModalOpen(false);
    await loadData();
  }

  // ─── Policy Handlers ───

  function openAddPolicy() {
    setEditingPolicy(null);
    setPolicyForm({ ...EMPTY_POLICY, pto_type_id: ptoTypes[0]?.id ?? '' });
    setPolicyModalOpen(true);
  }

  function openEditPolicy(p: PTOPolicy) {
    setEditingPolicy(p);
    setPolicyForm({
      policy_code: p.policy_code,
      policy_name: p.policy_name,
      pto_type_id: p.pto_type_id,
      applies_to_role_id: p.applies_to_role_id ?? '',
      accrual_method: p.accrual_method,
      annual_entitlement_hours: p.annual_entitlement_hours,
      accrual_rate_hours_per_payperiod: p.accrual_rate_hours_per_payperiod,
      carryover_cap_hours: p.carryover_cap_hours,
      balance_cap_hours: p.balance_cap_hours,
      waiting_period_days: p.waiting_period_days,
      allow_negative_balance: p.allow_negative_balance,
    });
    setPolicyModalOpen(true);
  }

  async function handleSavePolicy() {
    if (!policyForm.policy_code.trim() || !policyForm.policy_name.trim()) {
      showMessage('error', 'Policy code and name are required.');
      return;
    }
    if (!policyForm.pto_type_id) {
      showMessage('error', 'Please select a PTO type.');
      return;
    }
    setSaving(true);
    const payload = {
      policy_code: policyForm.policy_code.trim().toUpperCase(),
      policy_name: policyForm.policy_name.trim(),
      pto_type_id: policyForm.pto_type_id,
      applies_to_role_id: policyForm.applies_to_role_id || null,
      accrual_method: policyForm.accrual_method,
      annual_entitlement_hours: policyForm.annual_entitlement_hours,
      accrual_rate_hours_per_payperiod: policyForm.accrual_rate_hours_per_payperiod,
      carryover_cap_hours: policyForm.carryover_cap_hours,
      balance_cap_hours: policyForm.balance_cap_hours,
      waiting_period_days: policyForm.waiting_period_days,
      allow_negative_balance: policyForm.allow_negative_balance,
    };

    if (editingPolicy) {
      const { error } = await supabase.from('pto_policies').update(payload).eq('id', editingPolicy.id);
      if (error) { showMessage('error', 'Failed to update policy: ' + error.message); setSaving(false); return; }
      showMessage('success', 'Policy updated.');
    } else {
      const { error } = await supabase.from('pto_policies').insert(payload);
      if (error) { showMessage('error', 'Failed to create policy: ' + error.message); setSaving(false); return; }
      showMessage('success', 'Policy created.');
    }
    setSaving(false);
    setPolicyModalOpen(false);
    await loadData();
  }

  // ─── Delete Handler ───

  async function handleDelete() {
    if (!deleteConfirm) return;
    const table = deleteConfirm.type === 'pto_type' ? 'pto_types' : 'pto_policies';
    const { error } = await supabase.from(table).delete().eq('id', deleteConfirm.id);
    if (error) {
      showMessage('error', 'Failed to delete: ' + error.message);
    } else {
      showMessage('success', `${deleteConfirm.name} deleted.`);
      await loadData();
    }
    setDeleteConfirm(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--spinner-track)] border-t-[var(--spinner-fill)]" />
      </div>
    );
  }

  const ptoTypeOptions = ptoTypes.map(t => ({ value: t.id, label: t.pto_type_name }));
  const roleOptions = [{ value: '', label: '(All roles)' }, ...roles.map(r => ({ value: r.id, label: r.role_name }))];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">PTO Policies</h2>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">
          Manage paid time off types and accrual/entitlement policies.
        </p>
      </div>

      {message && (
        <div className={message.type === 'success'
          ? 'rounded-lg bg-[var(--color-success-bg)] px-4 py-3 text-sm text-[var(--color-success-text)]'
          : 'rounded-lg bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]'
        }>{message.text}</div>
      )}

      {/* ─── PTO Types ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">PTO Types</h3>
          <Button size="sm" onClick={openAddType}>
            <Plus className="h-4 w-4" />
            Add Type
          </Button>
        </div>

        {ptoTypes.length === 0 ? (
          <Card>
            <EmptyState
              icon={CalendarClock}
              title="No PTO types"
              description="Add types like Vacation, Sick, Personal to get started."
              action={<Button size="sm" onClick={openAddType}><Plus className="h-4 w-4" />Add Type</Button>}
            />
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Payable on Term.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Liability</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {ptoTypes.map(t => (
                    <tr key={t.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-mono font-medium text-[var(--text-primary)]">{t.pto_type_code}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--text-primary)]">{t.pto_type_name}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--text-secondary)]">{t.is_payable_on_termination ? 'Yes' : 'No'}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--text-secondary)]">{t.counts_toward_liability ? 'Yes' : 'No'}</td>
                      <td className="whitespace-nowrap px-6 py-4"><Badge variant={t.is_active ? 'success' : 'neutral'}>{t.is_active ? 'Active' : 'Inactive'}</Badge></td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditType(t)} className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteConfirm({ type: 'pto_type', id: t.id, name: t.pto_type_name })} className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--color-danger-bg)] hover:text-[var(--color-danger-text)] transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      {/* ─── PTO Policies ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Policies</h3>
          <Button size="sm" onClick={openAddPolicy} disabled={ptoTypes.length === 0}>
            <Plus className="h-4 w-4" />
            Add Policy
          </Button>
        </div>

        {policies.length === 0 ? (
          <Card>
            <EmptyState
              icon={CalendarClock}
              title="No policies"
              description={ptoTypes.length === 0 ? 'Create a PTO type first, then add policies.' : 'Add your first PTO policy.'}
              action={ptoTypes.length > 0 ? <Button size="sm" onClick={openAddPolicy}><Plus className="h-4 w-4" />Add Policy</Button> : undefined}
            />
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Policy Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">PTO Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Annual Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Applies To</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {policies.map(p => (
                    <tr key={p.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-mono font-medium text-[var(--text-primary)]">{p.policy_code}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--text-primary)]">{p.policy_name}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--text-secondary)]">{p.pto_type?.pto_type_name ?? '—'}</td>
                      <td className="whitespace-nowrap px-6 py-4"><Badge variant="default">{p.accrual_method}</Badge></td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--text-secondary)]">{p.annual_entitlement_hours}h</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--text-secondary)]">{p.applies_to_role?.role_name ?? 'All roles'}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditPolicy(p)} className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteConfirm({ type: 'policy', id: p.id, name: p.policy_name })} className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--color-danger-bg)] hover:text-[var(--color-danger-text)] transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      {/* ─── Delete Confirmation ─── */}
      <Modal open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Confirm Delete" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to delete <span className="font-semibold text-[var(--text-primary)]">{deleteConfirm?.name}</span>? This cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}><Trash2 className="h-4 w-4" />Delete</Button>
          </div>
        </div>
      </Modal>

      {/* ─── PTO Type Modal ─── */}
      <Modal open={typeModalOpen} onClose={() => setTypeModalOpen(false)} title={editingType ? 'Edit PTO Type' : 'Add PTO Type'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Type Code" placeholder="e.g. VACATION" required value={typeForm.pto_type_code} onChange={e => setTypeForm(f => ({ ...f, pto_type_code: e.target.value.toUpperCase() }))} />
            <Input label="Type Name" placeholder="e.g. Vacation" required value={typeForm.pto_type_name} onChange={e => setTypeForm(f => ({ ...f, pto_type_name: e.target.value }))} />
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={typeForm.is_payable_on_termination} onChange={e => setTypeForm(f => ({ ...f, is_payable_on_termination: e.target.checked }))} className="h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-surface)] text-[var(--accent)] focus:ring-[var(--accent)]" />
              <span className="text-sm text-[var(--text-secondary)]">Payable on termination</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={typeForm.counts_toward_liability} onChange={e => setTypeForm(f => ({ ...f, counts_toward_liability: e.target.checked }))} className="h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-surface)] text-[var(--accent)] focus:ring-[var(--accent)]" />
              <span className="text-sm text-[var(--text-secondary)]">Counts toward liability</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={typeForm.is_active} onChange={e => setTypeForm(f => ({ ...f, is_active: e.target.checked }))} className="h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-surface)] text-[var(--accent)] focus:ring-[var(--accent)]" />
              <span className="text-sm text-[var(--text-secondary)]">Active</span>
            </label>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
            <Button variant="ghost" onClick={() => setTypeModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSaveType} loading={saving}><Save className="h-4 w-4" />{editingType ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      {/* ─── Policy Modal ─── */}
      <Modal open={policyModalOpen} onClose={() => setPolicyModalOpen(false)} title={editingPolicy ? 'Edit Policy' : 'Add Policy'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Policy Code" placeholder="e.g. VAC-FT" required value={policyForm.policy_code} onChange={e => setPolicyForm(f => ({ ...f, policy_code: e.target.value.toUpperCase() }))} />
            <Input label="Policy Name" placeholder="e.g. Full-Time Vacation" required value={policyForm.policy_name} onChange={e => setPolicyForm(f => ({ ...f, policy_name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="PTO Type" options={ptoTypeOptions} value={policyForm.pto_type_id} onChange={e => setPolicyForm(f => ({ ...f, pto_type_id: e.target.value }))} />
            <Select label="Applies To Role" options={roleOptions} value={policyForm.applies_to_role_id} onChange={e => setPolicyForm(f => ({ ...f, applies_to_role_id: e.target.value }))} />
          </div>
          <Select label="Accrual Method" options={ACCRUAL_OPTIONS} value={policyForm.accrual_method} onChange={e => setPolicyForm(f => ({ ...f, accrual_method: e.target.value as 'accrual' | 'entitlement' }))} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Annual Entitlement (hours)" type="number" min={0} value={policyForm.annual_entitlement_hours} onChange={e => setPolicyForm(f => ({ ...f, annual_entitlement_hours: Number(e.target.value) }))} />
            <Input label="Accrual Rate (hrs/period)" type="number" min={0} step={0.01} value={policyForm.accrual_rate_hours_per_payperiod} onChange={e => setPolicyForm(f => ({ ...f, accrual_rate_hours_per_payperiod: Number(e.target.value) }))} />
            <Input label="Waiting Period (days)" type="number" min={0} value={policyForm.waiting_period_days} onChange={e => setPolicyForm(f => ({ ...f, waiting_period_days: Number(e.target.value) }))} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Carryover Cap (hours)" type="number" min={0} value={policyForm.carryover_cap_hours} onChange={e => setPolicyForm(f => ({ ...f, carryover_cap_hours: Number(e.target.value) }))} />
            <Input label="Balance Cap (hours)" type="number" min={0} value={policyForm.balance_cap_hours} onChange={e => setPolicyForm(f => ({ ...f, balance_cap_hours: Number(e.target.value) }))} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={policyForm.allow_negative_balance} onChange={e => setPolicyForm(f => ({ ...f, allow_negative_balance: e.target.checked }))} className="h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-surface)] text-[var(--accent)] focus:ring-[var(--accent)]" />
            <span className="text-sm text-[var(--text-secondary)]">Allow negative balance</span>
          </label>
          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
            <Button variant="ghost" onClick={() => setPolicyModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSavePolicy} loading={saving}><Save className="h-4 w-4" />{editingPolicy ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
