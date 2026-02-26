'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, MapPin, Pencil, Trash2, Save } from 'lucide-react';
import type { Site } from '@/types/database';

const TIME_ZONE_OPTIONS = [
  { value: 'America/Toronto', label: 'America/Toronto (Eastern)' },
  { value: 'America/Vancouver', label: 'America/Vancouver (Pacific)' },
  { value: 'America/Edmonton', label: 'America/Edmonton (Mountain)' },
  { value: 'America/Winnipeg', label: 'America/Winnipeg (Central)' },
  { value: 'America/Halifax', label: 'America/Halifax (Atlantic)' },
  { value: 'America/St_Johns', label: "America/St_Johns (Newfoundland)" },
];

const EMPTY_FORM: Omit<Site, 'id' | 'created_at' | 'updated_at'> = {
  site_code: '',
  site_name: '',
  address_line1: '',
  city: '',
  region_state: '',
  postal_code: '',
  country: 'CA',
  time_zone: 'America/Toronto',
  is_active: true,
};

interface FormErrors {
  site_code?: string;
  site_name?: string;
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const supabase = createClient();

  const loadSites = useCallback(async () => {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('site_name');

    if (error) {
      showMessage('error', 'Failed to load sites: ' + error.message);
    } else {
      setSites(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  function openAddModal() {
    setEditingSite(null);
    setForm({ ...EMPTY_FORM });
    setErrors({});
    setModalOpen(true);
  }

  function openEditModal(site: Site) {
    setEditingSite(site);
    setForm({
      site_code: site.site_code,
      site_name: site.site_name,
      address_line1: site.address_line1,
      city: site.city,
      region_state: site.region_state,
      postal_code: site.postal_code,
      country: site.country,
      time_zone: site.time_zone,
      is_active: site.is_active,
    });
    setErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingSite(null);
    setForm({ ...EMPTY_FORM });
    setErrors({});
  }

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key in errors) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!form.site_code.trim()) {
      newErrors.site_code = 'Site code is required';
    } else if (!/^[A-Z0-9_-]+$/.test(form.site_code.trim())) {
      newErrors.site_code = 'Site code must be uppercase letters, numbers, hyphens, or underscores';
    }

    if (!form.site_name.trim()) {
      newErrors.site_name = 'Site name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);

    const payload = {
      site_code: form.site_code.trim().toUpperCase(),
      site_name: form.site_name.trim(),
      address_line1: form.address_line1.trim(),
      city: form.city.trim(),
      region_state: form.region_state.trim(),
      postal_code: form.postal_code.trim(),
      country: form.country.trim(),
      time_zone: form.time_zone,
      is_active: form.is_active,
    };

    if (editingSite) {
      const { error } = await supabase
        .from('sites')
        .update(payload)
        .eq('id', editingSite.id);

      if (error) {
        showMessage('error', 'Failed to update site: ' + error.message);
      } else {
        showMessage('success', `Site "${payload.site_name}" updated successfully.`);
        closeModal();
        await loadSites();
      }
    } else {
      const { error } = await supabase
        .from('sites')
        .insert(payload);

      if (error) {
        showMessage('error', 'Failed to create site: ' + error.message);
      } else {
        showMessage('success', `Site "${payload.site_name}" created successfully.`);
        closeModal();
        await loadSites();
      }
    }

    setSaving(false);
  }

  async function handleDelete(siteId: string) {
    const site = sites.find(s => s.id === siteId);
    const { error } = await supabase
      .from('sites')
      .delete()
      .eq('id', siteId);

    if (error) {
      showMessage('error', 'Failed to delete site: ' + error.message);
    } else {
      showMessage('success', `Site "${site?.site_name}" deleted successfully.`);
      await loadSites();
    }
    setDeleteConfirmId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--spinner-track)] border-t-[var(--spinner-fill)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Sites</h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Manage physical locations and office sites.
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Add Site
        </Button>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={
            message.type === 'success'
              ? 'rounded-lg border border-[var(--color-success-bg)] bg-[var(--color-success-bg)] px-4 py-3 text-sm text-[var(--color-success-text)]'
              : 'rounded-lg border border-[var(--color-danger-bg)] bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]'
          }
        >
          {message.text}
        </div>
      )}

      {/* Sites Table */}
      {sites.length === 0 ? (
        <Card>
          <EmptyState
            icon={MapPin}
            title="No sites yet"
            description="Add your first site to get started."
            action={
              <Button onClick={openAddModal} size="sm">
                <Plus className="h-4 w-4" />
                Add Site
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    Site Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    Region / State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sites.map(site => (
                  <tr
                    key={site.id}
                    className="cursor-pointer transition-colors hover:bg-[var(--bg-surface-hover)]"
                    onClick={() => openEditModal(site)}
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-mono font-medium text-[var(--text-primary)]">
                      {site.site_code}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--text-primary)]">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[var(--text-muted)]" />
                        {site.site_name}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {site.city || '\u2014'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {site.region_state || '\u2014'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {site.country || '\u2014'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <Badge variant={site.is_active ? 'success' : 'neutral'}>
                        {site.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(site);
                          }}
                          className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors"
                          title="Edit site"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(site.id);
                          }}
                          className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--color-danger-bg)] hover:text-[var(--color-danger-text)] transition-colors"
                          title="Delete site"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[var(--border)] px-6 py-3">
            <p className="text-xs text-[var(--text-muted)]">
              {sites.length} site{sites.length !== 1 ? 's' : ''} total
            </p>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Site"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to delete the site{' '}
            <span className="font-semibold text-[var(--text-primary)]">
              {sites.find(s => s.id === deleteConfirmId)?.site_name}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteConfirmId) handleDelete(deleteConfirmId);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingSite ? 'Edit Site' : 'Add Site'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Row: Site Code + Site Name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Site Code"
              placeholder="e.g. HQ-001"
              required
              value={form.site_code}
              onChange={e => updateField('site_code', e.target.value.toUpperCase())}
              error={errors.site_code}
              pattern="[A-Z0-9_-]+"
            />
            <Input
              label="Site Name"
              placeholder="e.g. Head Office"
              required
              value={form.site_name}
              onChange={e => updateField('site_name', e.target.value)}
              error={errors.site_name}
            />
          </div>

          {/* Address Line 1 */}
          <Input
            label="Address Line 1"
            placeholder="e.g. 123 Main Street"
            value={form.address_line1}
            onChange={e => updateField('address_line1', e.target.value)}
          />

          {/* Row: City + Region/State */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="City"
              placeholder="e.g. Toronto"
              value={form.city}
              onChange={e => updateField('city', e.target.value)}
            />
            <Input
              label="Region / State"
              placeholder="e.g. Ontario"
              value={form.region_state}
              onChange={e => updateField('region_state', e.target.value)}
            />
          </div>

          {/* Row: Postal Code + Country */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Postal Code"
              placeholder="e.g. M5V 2T6"
              value={form.postal_code}
              onChange={e => updateField('postal_code', e.target.value)}
            />
            <Input
              label="Country"
              placeholder="e.g. CA"
              value={form.country}
              onChange={e => updateField('country', e.target.value)}
            />
          </div>

          {/* Time Zone */}
          <Select
            label="Time Zone"
            options={TIME_ZONE_OPTIONS}
            value={form.time_zone}
            onChange={e => updateField('time_zone', e.target.value)}
          />

          {/* Active Checkbox */}
          <div className="flex items-center gap-3">
            <input
              id="is-active"
              type="checkbox"
              checked={form.is_active}
              onChange={e => updateField('is_active', e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-surface)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-0"
            />
            <label htmlFor="is-active" className="text-sm font-medium text-[var(--text-secondary)]">
              Active
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
            <Button variant="ghost" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              <Save className="h-4 w-4" />
              {editingSite ? 'Update Site' : 'Create Site'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
