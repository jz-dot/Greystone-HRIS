'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, CalendarDays, Pencil, Trash2, Save } from 'lucide-react';
import type { Holiday, Site } from '@/types/database';

const COUNTRY_OPTIONS = [
  { value: 'CA', label: 'Canada' },
  { value: 'US', label: 'United States' },
];

const EMPTY_FORM = {
  holiday_code: '',
  holiday_name: '',
  date: '',
  country: 'CA',
  region_state: '',
  site_id: '',
  is_paid: true,
  notes: '',
};

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<(Holiday & { site?: Site })[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const supabase = createClient();

  const loadData = useCallback(async () => {
    const [holidaysRes, sitesRes] = await Promise.all([
      supabase.from('holidays').select('*, site:sites(*)').order('date', { ascending: false }),
      supabase.from('sites').select('*').eq('is_active', true).order('site_name'),
    ]);

    if (holidaysRes.error) showMessage('error', 'Failed to load holidays: ' + holidaysRes.error.message);
    else setHolidays(holidaysRes.data ?? []);

    if (!sitesRes.error) setSites(sitesRes.data ?? []);

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  function openAddModal() {
    setEditingHoliday(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  }

  function openEditModal(h: Holiday) {
    setEditingHoliday(h);
    setForm({
      holiday_code: h.holiday_code,
      holiday_name: h.holiday_name,
      date: h.date,
      country: h.country,
      region_state: h.region_state,
      site_id: h.site_id ?? '',
      is_paid: h.is_paid,
      notes: h.notes,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingHoliday(null);
  }

  async function handleSave() {
    if (!form.holiday_code.trim() || !form.holiday_name.trim() || !form.date) {
      showMessage('error', 'Code, name, and date are required.');
      return;
    }
    setSaving(true);
    const payload = {
      holiday_code: form.holiday_code.trim().toUpperCase(),
      holiday_name: form.holiday_name.trim(),
      date: form.date,
      country: form.country,
      region_state: form.region_state.trim(),
      site_id: form.site_id || null,
      is_paid: form.is_paid,
      notes: form.notes.trim(),
    };

    if (editingHoliday) {
      const { error } = await supabase.from('holidays').update(payload).eq('id', editingHoliday.id);
      if (error) { showMessage('error', 'Failed to update: ' + error.message); setSaving(false); return; }
      showMessage('success', `Holiday "${payload.holiday_name}" updated.`);
    } else {
      const { error } = await supabase.from('holidays').insert(payload);
      if (error) { showMessage('error', 'Failed to create: ' + error.message); setSaving(false); return; }
      showMessage('success', `Holiday "${payload.holiday_name}" created.`);
    }
    setSaving(false);
    closeModal();
    await loadData();
  }

  async function handleDelete(id: string) {
    const h = holidays.find(x => x.id === id);
    const { error } = await supabase.from('holidays').delete().eq('id', id);
    if (error) {
      showMessage('error', 'Failed to delete: ' + error.message);
    } else {
      showMessage('success', `Holiday "${h?.holiday_name}" deleted.`);
      await loadData();
    }
    setDeleteConfirmId(null);
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--spinner-track)] border-t-[var(--spinner-fill)]" />
      </div>
    );
  }

  const siteOptions = [{ value: '', label: '(All sites)' }, ...sites.map(s => ({ value: s.id, label: s.site_name }))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Holidays</h2>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Manage statutory and company holidays.
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Add Holiday
        </Button>
      </div>

      {message && (
        <div className={message.type === 'success'
          ? 'rounded-lg bg-[var(--color-success-bg)] px-4 py-3 text-sm text-[var(--color-success-text)]'
          : 'rounded-lg bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]'
        }>{message.text}</div>
      )}

      {holidays.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title="No holidays yet"
            description="Add statutory and company holidays."
            action={<Button size="sm" onClick={openAddModal}><Plus className="h-4 w-4" />Add Holiday</Button>}
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Holiday</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Country</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Region</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Site</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Paid</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {holidays.map(h => (
                  <tr key={h.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-mono font-medium text-[var(--text-primary)]">{h.holiday_code}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--text-primary)]">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-[var(--text-muted)]" />
                        {h.holiday_name}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--text-secondary)]">{formatDate(h.date)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--text-secondary)]">{h.country}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--text-secondary)]">{h.region_state || '—'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--text-secondary)]">{h.site?.site_name || 'All'}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge variant={h.is_paid ? 'success' : 'neutral'}>{h.is_paid ? 'Paid' : 'Unpaid'}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditModal(h)} className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteConfirmId(h.id)} className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--color-danger-bg)] hover:text-[var(--color-danger-text)] transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[var(--border)] px-6 py-3">
            <p className="text-xs text-[var(--text-muted)]">{holidays.length} holiday{holidays.length !== 1 ? 's' : ''} total</p>
          </div>
        </Card>
      )}

      {/* Delete Confirmation */}
      <Modal open={deleteConfirmId !== null} onClose={() => setDeleteConfirmId(null)} title="Delete Holiday" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to delete <span className="font-semibold text-[var(--text-primary)]">{holidays.find(h => h.id === deleteConfirmId)?.holiday_name}</span>? This cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => { if (deleteConfirmId) handleDelete(deleteConfirmId); }}><Trash2 className="h-4 w-4" />Delete</Button>
          </div>
        </div>
      </Modal>

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editingHoliday ? 'Edit Holiday' : 'Add Holiday'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Holiday Code" placeholder="e.g. CA-XMAS-2026" required value={form.holiday_code} onChange={e => setForm(f => ({ ...f, holiday_code: e.target.value.toUpperCase() }))} />
            <Input label="Holiday Name" placeholder="e.g. Christmas Day" required value={form.holiday_name} onChange={e => setForm(f => ({ ...f, holiday_name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Date" type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <Select label="Country" options={COUNTRY_OPTIONS} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
            <Input label="Region / Province" placeholder="e.g. ON" value={form.region_state} onChange={e => setForm(f => ({ ...f, region_state: e.target.value }))} />
          </div>
          <Select label="Site (optional)" options={siteOptions} value={form.site_id} onChange={e => setForm(f => ({ ...f, site_id: e.target.value }))} />
          <Textarea label="Notes" placeholder="Optional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_paid} onChange={e => setForm(f => ({ ...f, is_paid: e.target.checked }))} className="h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-surface)] text-[var(--accent)] focus:ring-[var(--accent)]" />
            <span className="text-sm text-[var(--text-secondary)]">Paid holiday</span>
          </label>
          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
            <Button variant="ghost" onClick={closeModal} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}><Save className="h-4 w-4" />{editingHoliday ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
