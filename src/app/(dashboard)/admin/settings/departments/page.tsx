'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, Layers, Pencil, Trash2, Save } from 'lucide-react';
import type { Department, Site } from '@/types/database';

type DepartmentWithSite = Department & {
  site?: { id: string; site_name: string };
};

interface DepartmentForm {
  dept_code: string;
  dept_name: string;
  site_id: string;
  parent_dept_id: string;
  cost_center_code: string;
  is_active: boolean;
}

const emptyForm: DepartmentForm = {
  dept_code: '',
  dept_name: '',
  site_id: '',
  parent_dept_id: '',
  cost_center_code: '',
  is_active: true,
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentWithSite[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterSiteId, setFilterSiteId] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DepartmentForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof DepartmentForm, string>>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const supabase = createClient();

  const loadData = useCallback(async () => {
    setLoading(true);
    const [deptRes, siteRes] = await Promise.all([
      supabase
        .from('departments')
        .select('*, site:sites(id, site_name)')
        .order('dept_code'),
      supabase
        .from('sites')
        .select('*')
        .eq('is_active', true)
        .order('site_name'),
    ]);
    setDepartments(deptRes.data ?? []);
    setSites(siteRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------- Filtering ----------

  const filtered = departments.filter((d) => {
    if (filterSiteId === 'all') return true;
    return d.site_id === filterSiteId;
  });

  // ---------- Form helpers ----------

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }

  function openEditModal(dept: DepartmentWithSite) {
    setEditingId(dept.id);
    setForm({
      dept_code: dept.dept_code,
      dept_name: dept.dept_name,
      site_id: dept.site_id ?? '',
      parent_dept_id: dept.parent_dept_id ?? '',
      cost_center_code: dept.cost_center_code ?? '',
      is_active: dept.is_active,
    });
    setErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof DepartmentForm, string>> = {};
    if (!form.dept_code.trim()) newErrors.dept_code = 'Dept code is required';
    if (!form.dept_name.trim()) newErrors.dept_name = 'Dept name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ---------- CRUD ----------

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      dept_code: form.dept_code.trim(),
      dept_name: form.dept_name.trim(),
      site_id: form.site_id || null,
      parent_dept_id: form.parent_dept_id || null,
      cost_center_code: form.cost_center_code.trim(),
      is_active: form.is_active,
    };

    if (editingId) {
      const { error } = await supabase
        .from('departments')
        .update(payload)
        .eq('id', editingId);
      if (error) {
        console.error('Update failed:', error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from('departments')
        .insert(payload);
      if (error) {
        console.error('Insert failed:', error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    closeModal();
    await loadData();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) {
      console.error('Delete failed:', error.message);
    }
    setDeleteConfirmId(null);
    await loadData();
  }

  // ---------- Dropdown option builders ----------

  const siteFilterOptions = [
    { value: 'all', label: 'All Sites' },
    ...sites.map((s) => ({ value: s.id, label: s.site_name })),
  ];

  const siteFormOptions = [
    { value: '', label: '-- No Site --' },
    ...sites.map((s) => ({ value: s.id, label: s.site_name })),
  ];

  const parentDeptOptions = [
    { value: '', label: '-- None --' },
    ...departments
      .filter((d) => d.id !== editingId)
      .map((d) => ({ value: d.id, label: `${d.dept_code} - ${d.dept_name}` })),
  ];

  // ---------- Render ----------

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Departments</h1>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </div>

      {/* Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full sm:w-64">
          <Select
            label="Filter by Site"
            options={siteFilterOptions}
            value={filterSiteId}
            onChange={(e) => setFilterSiteId(e.target.value)}
          />
        </div>
        <p className="text-sm text-[var(--text-tertiary)]">
          {filtered.length} department{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Table / List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No departments found"
          description={
            filterSiteId !== 'all'
              ? 'No departments match the selected site filter.'
              : 'Get started by adding your first department.'
          }
          action={
            filterSiteId === 'all' ? (
              <Button onClick={openAddModal} size="sm">
                <Plus className="h-4 w-4" />
                Add Department
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-6 py-3 text-left font-medium text-[var(--text-tertiary)]">
                    Dept Code
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-[var(--text-tertiary)]">
                    Dept Name
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-[var(--text-tertiary)]">
                    Site
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-[var(--text-tertiary)]">
                    Cost Center
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-[var(--text-tertiary)]">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-[var(--text-tertiary)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((dept) => (
                  <tr
                    key={dept.id}
                    className="border-b border-[var(--border)] last:border-b-0 cursor-pointer transition-colors hover:bg-[var(--bg-surface-hover)]"
                    onClick={() => openEditModal(dept)}
                  >
                    <td className="px-6 py-3 font-mono text-[var(--text-primary)]">
                      {dept.dept_code}
                    </td>
                    <td className="px-6 py-3 text-[var(--text-primary)]">
                      {dept.dept_name}
                    </td>
                    <td className="px-6 py-3 text-[var(--text-secondary)]">
                      {dept.site?.site_name ?? <span className="text-[var(--text-muted)]">--</span>}
                    </td>
                    <td className="px-6 py-3 font-mono text-[var(--text-secondary)]">
                      {dept.cost_center_code || <span className="text-[var(--text-muted)]">--</span>}
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={dept.is_active ? 'success' : 'neutral'}>
                        {dept.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(dept);
                          }}
                          aria-label={`Edit ${dept.dept_name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(dept.id);
                          }}
                          aria-label={`Delete ${dept.dept_name}`}
                        >
                          <Trash2 className="h-4 w-4 text-[var(--color-danger-text)]" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Department' : 'Add Department'}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Dept Code"
              placeholder="e.g. ENG"
              required
              value={form.dept_code}
              onChange={(e) => setForm({ ...form, dept_code: e.target.value })}
              error={errors.dept_code}
            />
            <Input
              label="Dept Name"
              placeholder="e.g. Engineering"
              required
              value={form.dept_name}
              onChange={(e) => setForm({ ...form, dept_name: e.target.value })}
              error={errors.dept_name}
            />
          </div>

          <Select
            label="Site"
            options={siteFormOptions}
            value={form.site_id}
            onChange={(e) => setForm({ ...form, site_id: e.target.value })}
          />

          <Select
            label="Parent Department"
            options={parentDeptOptions}
            value={form.parent_dept_id}
            onChange={(e) => setForm({ ...form, parent_dept_id: e.target.value })}
          />

          <Input
            label="Cost Center Code"
            placeholder="e.g. CC-1001"
            value={form.cost_center_code}
            onChange={(e) => setForm({ ...form, cost_center_code: e.target.value })}
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            <span className="text-sm font-medium text-[var(--text-secondary)]">Active</span>
          </label>

          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              <Save className="h-4 w-4" />
              {editingId ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Department"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to delete this department? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
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
    </div>
  );
}
